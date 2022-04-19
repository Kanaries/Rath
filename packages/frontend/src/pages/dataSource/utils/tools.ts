import { Cleaner } from "visual-insights";
import { RATH_INDEX_COLUMN_KEY } from "../../../constants";
import { IMuteFieldBase, IRow } from "../../../interfaces";
import { formatTimeField } from "../../../utils/transform";

/**
 * 给数据添加特殊的index key，注意这是一个会修改参数的函数
 * @param data 
 */
 export function setIndexKey(data: IRow[]): IRow[] {
    data.forEach((record, i, arr) => {
        arr[i][RATH_INDEX_COLUMN_KEY] = i;
    })
    return data;
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

function trimValues(data: IRow[], fids: string[]) {
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < fids.length; j++) {
            if (typeof data[i][fids[j]] === 'string') {
                data[i][fids[j]] = (data[i][fids[j]] as string).trim()
            }
        }
    }
    return data;
}

export function transFileData (rawData: IRow[]) {
    /**
     * tmpFields is fields cat by specific rules, the results is not correct sometimes, waitting for human's input
     */
    let tmpFields: IMuteFieldBase[] = []
    rawData = Cleaner.dropNullColumn(rawData, Object.keys(rawData[0])).dataSource
    if (rawData.length > 0 && Object.keys(rawData[rawData.length - 1]).length === 0) {
        rawData.pop();
    }
    // FIXME: 第一条数据取meta的危险性
    let names = Object.keys(rawData[0])
    const fids = formatColKeys(names);
    rawData = formatColKeysInRow(names, fids, rawData)

    rawData = setIndexKey(rawData);
    tmpFields = names.map((name, index) => {
        return {
            fid: fids[index],
            name,
            analyticType: '?', //inferAnalyticType(rawData, fid),
            semanticType: '?', //inferSemanticType(rawData, fid),
            disable: '?'
        }
    })
    tmpFields.push({
        fid: RATH_INDEX_COLUMN_KEY,
        name: 'Rath Row ID',
        analyticType: 'dimension',
        semanticType: 'ordinal',
        disable: false
    })
    trimValues(rawData, fids)
    const timeFieldKeys = tmpFields.filter(f => f.semanticType === 'temporal').map(f => f.fid);
    formatTimeField(rawData, timeFieldKeys);
    return {
        fields: tmpFields,
        dataSource: rawData
    }
}