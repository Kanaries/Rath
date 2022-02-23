import { RATH_INDEX_COLUMN_KEY, STORAGE_FILE_SUFFIX } from "../../constants";
// import { BIField, Record } from "../../global";
import { FileLoader, inferAnalyticType, inferSemanticType, isASCII } from "../../utils";
import { Cleaner, Sampling } from 'visual-insights';
import { FileReader } from '@kanaries/web-data-loader'
import intl from 'react-intl-universal';
import { useMemo } from "react";
import { IRawField, IRow } from "../../interfaces";
import { IRathStorage, RathStorageParse } from "../../utils/storage";
import { formatTimeField } from "../../utils/transform";
// import { isFieldTime } from "visual-insights/build/esm/utils";

export enum SampleKey {
  none = 'none',
  reservoir = 'reservoir',
}

export const useSampleOptions = function () {
    const noneText = intl.get(`dataSource.sampling.${SampleKey.none}`);
    const reservoirText = intl.get(`dataSource.sampling.${SampleKey.reservoir}`);
    const options = useMemo(() => {
        return [
            {
                key: SampleKey.none,
                text: noneText,
            },
            {
                key: SampleKey.reservoir,
                text: reservoirText,
            },
        ];
    }, [noneText, reservoirText])
    return options;
}

/**
 * 给数据添加特殊的index key，注意这是一个会修改参数的函数
 * @param data 
 */
export function setIndexKey(data: IRow[]): IRow[] {
    data.forEach((record, i) => {
        record[RATH_INDEX_COLUMN_KEY] = i;
    })
    return data;
}

/**
 * 针对vega中对Unicode字段的相关bug做的调整（非ascii字符会被删除掉，会导致字段名不唯一的bug问题）
 * @param fields 
 * @param dataSource 
 * @returns 
 */
export function fixUnicodeFields(fields: IRawField[], dataSource: IRow[]): {
    fields: IRawField[],
    dataSource: IRow[]
} {
    const newFields: IRawField[] = fields.map((f, i) => {
        const nF = { ...f };
        if (!isASCII(nF.fid)) {
            nF.fid = `${f.fid}(Rath_Field_${i})`
        }
        return nF
    })
    const newDataSource: IRow[] = dataSource.map(row => {
        const newRow: IRow = {};
        for (let i = 0; i < newFields.length; i++) {
            newRow[newFields[i].fid] = row[fields[i].fid] 
        }
        return newRow
    })
    return {
        fields: newFields,
        dataSource: newDataSource
    }
}

const onDataLoading = (value: number) => {
    console.log('data loading', Math.round(value * 100) + '%')
}

export async function loadDataFile(file: File, sampleMethod: SampleKey, sampleSize: number = 500) {

    /**
     * tmpFields is fields cat by specific rules, the results is not correct sometimes, waitting for human's input
     */
    let tmpFields: IRawField[] = []
    let rawData: IRow[] = []

    if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel') {
        rawData = []
        if (sampleMethod === SampleKey.reservoir) {
            rawData = (await FileReader.csvReader({
              file,
              config: {
                type: 'reservoirSampling',
                size: sampleSize,
              },
              onLoading: onDataLoading
            })) as IRow[]
        } else {
            rawData = (await FileReader.csvReader({
              file,
              onLoading: onDataLoading
            })) as IRow[]
        }
    } else if (file.type === 'application/json') {
        rawData = await FileLoader.jsonLoader(file)
        if (sampleMethod === SampleKey.reservoir) {
            rawData = Sampling.reservoirSampling(rawData, sampleSize)
        }
    } else {
        throw new Error(`unsupported file type=${file.type} `)
    }
    rawData = Cleaner.dropNullColumn(rawData, Object.keys(rawData[0])).dataSource
    rawData = setIndexKey(rawData);
    // FIXME: 第一条数据取meta的危险性
    let fids = Object.keys(rawData[0])
    tmpFields = fids.map((fid, index) => {
        if (fid === RATH_INDEX_COLUMN_KEY) return {
            fid,
            analyticType: 'dimension',
            semanticType: 'nominal',
            disable: false
        }
        return {
            fid,
            analyticType: inferAnalyticType(rawData, fid),
            semanticType: inferSemanticType(rawData, fid),
            disable: false
        }
    })
    const timeFieldKeys = tmpFields.filter(f => f.semanticType === 'temporal').map(f => f.fid);
    formatTimeField(rawData, timeFieldKeys);
    const fixedDataSet = fixUnicodeFields(tmpFields, rawData);
    return fixedDataSet;
}

export async function loadRathStorageFile (file: File): Promise<IRathStorage> {
    // FIXME file type
    if (file.name.split('.').slice(-1)[0] === STORAGE_FILE_SUFFIX) {
        const rawContent = await FileLoader.textLoader(file);
        return RathStorageParse(rawContent);
    } else {
        throw new Error(`file type not supported: ${file.name.split('.').slice(-1)[0]}`)
    }
}