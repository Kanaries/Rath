import { RATH_INDEX_COLUMN_KEY } from "../../constants";
import { BIField, Record } from "../../global";
import { FileLoader, isASCII } from "../../utils";
import { Cleaner, Sampling } from 'visual-insights';
import { FileReader } from '@kanaries/web-data-loader'
import intl from 'react-intl-universal';
import { useMemo } from "react";

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
export function setIndexKey(data: Record[]): Record[] {
    data.forEach((record, i) => {
        record[RATH_INDEX_COLUMN_KEY] = i;
    })
    return data;
}

export function fixUnicodeFields(fields: BIField[], dataSource: Record[]): {
    fields: BIField[],
    dataSource: Record[]
} {
    const newFields: BIField[] = fields.map((f, i) => {
        const nF = { ...f };
        if (!isASCII(nF.name)) {
            nF.name = `${f.name}-cid-${i}`
        }
        return nF
    })
    const newDataSource: Record[] = dataSource.map(row => {
        const newRow: Record = {};
        for (let i = 0; i < newFields.length; i++) {
            newRow[newFields[i].name] = row[fields[i].name] 
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
    let tmpFields: BIField[] = []
    let rawData: Record[] = []

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
            })) as Record[]
        } else {
            rawData = (await FileReader.csvReader({
              file,
              onLoading: onDataLoading
            })) as Record[]
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
    let keys = Object.keys(rawData[0])
    tmpFields = keys.map((fieldName, index) => {
        if (fieldName === RATH_INDEX_COLUMN_KEY) return {
            name: fieldName,
            type: 'dimension'
        }
        return {
            name: fieldName,
            type: rawData.every((row) => {
                    return !isNaN(row[fieldName]) || row[fieldName] === undefined
                })
                ? 'measure'
                : 'dimension',
        }
    })
    const fixedDataSet = fixUnicodeFields(tmpFields, rawData);
    return fixedDataSet;
}