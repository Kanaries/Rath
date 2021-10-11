import { IAnalyticType, IDataType, IRow, ISemanticType } from "../interfaces";
const DB_DATA_TYPE_TO_DATA_TYPE: { [key: string]: IDataType } = {
    'Int8': 'integer',
    'Int16': 'integer',
    'Int32': 'integer',
    'Int64': 'integer',
    'UInt8': 'integer',
    'UInt16': 'integer',
    'UInt32': 'number',
    'UInt64': 'number',
    'Float32': 'number',
    'Float64': 'number',
    'BOOLEAN': 'boolean',
    'String': 'string'
}

const DEFAULT_SEMANTIC_TYPE = {
    'number': 'quantitative',
    'integer': 'quantitative',
    'boolean': 'nominal',
    'date': 'temporal',
    'string': 'nominal'
} as const;

const DEFAULT_ANALYTIC_TYPE = {
    'number': 'measure',
    'integer': 'measure',
    'boolean': 'dimension',
    'date': 'dimension',
    'string': 'dimension'
} as const;

export function dbDataType2DataType (dbDataType: string): IDataType {
    return DB_DATA_TYPE_TO_DATA_TYPE[dbDataType] || 'string';
}

export function inferSemanticTypeFromDataType (dataType: IDataType): ISemanticType {
    return DEFAULT_SEMANTIC_TYPE[dataType]
}

export function inferAnalyticTypeFromDataType (dataType: IDataType): IAnalyticType {
    return DEFAULT_ANALYTIC_TYPE[dataType];
}
export function parseCell(rawValue: string, dataType: string) {
    switch (dataType) {
        case 'Int8':
        case 'Int16':
        case 'Int32':
        case 'Int64':
        // case 'Int128':
        // case 'Int256':
        case 'UInt8':
        case 'UInt16':
        case 'UInt32':
        case 'UInt64':
            return parseInt(rawValue);
        case 'Float32':
        case 'Float64':
            return Number(rawValue);
        default:
            return rawValue;
    }
}
export function parseTable (str: string, fields: {fid: string; dataType: string}[]): IRow[] {
    const rows: IRow[] = [];
    const rawRows = str.slice(0, -1).split('\n');
    for (let rawRow of rawRows) {
        const row: IRow = {};
        const rowValues = rawRow.split(/[\t]/);
        for (let i = 0; i < fields.length; i++) {
            row[fields[i].fid] = parseCell(rowValues[i], fields[i].dataType)
        }
        rows.push(row)
    }
    return rows;
}