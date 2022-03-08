import { RATH_INDEX_COLUMN_KEY, STORAGE_FILE_SUFFIX } from "../../constants";
// import { BIField, Record } from "../../global";
import { FileLoader } from "../../utils";
import { Cleaner, Sampling } from 'visual-insights';
import { FileReader } from '@kanaries/web-data-loader'
import intl from 'react-intl-universal';
import { useMemo } from "react";
import { IMuteFieldBase, IRow } from "../../interfaces";
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

const onDataLoading = (value: number) => {
    console.log('data loading', Math.round(value * 100) + '%')
}
/**
 * 调整字段key，避免一些非法符号的影响。
 * 这个可以
 * @param colKeys 
 */
function formatColKeys(colKeys: string[]): string[] {
    return colKeys.map((col, colIndex) => {
        return `col_${colIndex}_${Math.round(Math.random() * 100)}`
    })
}

function formatColKeysInRow(originalKeys: string[], newKeys: string[], data: IRow[]): IRow[] {
    const newData: IRow[] = [];
    for (let i = 0; i < data.length; i++) {
        const newRow: IRow = {};
        for (let j = 0; j < newKeys.length; j++) {
            newRow[newKeys[j]] = data[i][originalKeys[j]];
        }
        newData.push(newRow)
    }
    return newData
}

export async function loadDataFile(file: File, sampleMethod: SampleKey, sampleSize: number = 500): Promise<{
    fields: IMuteFieldBase[];
    dataSource: IRow[]
}> {

    /**
     * tmpFields is fields cat by specific rules, the results is not correct sometimes, waitting for human's input
     */
    let tmpFields: IMuteFieldBase[] = []
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
    let names = Object.keys(rawData[0])
    const fids = formatColKeys(names);
    rawData = formatColKeysInRow(names, fids, rawData)
    const rathIndexColRef: IMuteFieldBase = {
        fid: RATH_INDEX_COLUMN_KEY,
        analyticType: 'dimension',
        semanticType: 'nominal',
        disable: false
    }
    tmpFields = names.map((name, index) => {
        if (name === RATH_INDEX_COLUMN_KEY) return rathIndexColRef;
        return {
            fid: fids[index],
            name,
            analyticType: '?', //inferAnalyticType(rawData, fid),
            semanticType: '?', //inferSemanticType(rawData, fid),
            disable: '?'
        }
    })
    const timeFieldKeys = tmpFields.filter(f => f.semanticType === 'temporal').map(f => f.fid);
    formatTimeField(rawData, timeFieldKeys);
    return {
        fields: tmpFields,
        dataSource: rawData
    }
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