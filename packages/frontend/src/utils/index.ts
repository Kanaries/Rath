import * as FileLoader from './fileParser';
import * as Transform from './transform';
import deepcopy from './deepcopy';
import { IRow } from '../interfaces';
// TODO: Rath和VI中都有一套，弱约束关联，可能带来潜在的迭代负担或bug
import { IAnalyticType, IDataType, ISemanticType } from 'visual-insights/build/esm/insights/InsightFlow/interfaces';

function isASCII(str: string) {
  return /^[\x00-\x7F]*$/.test(str)
}


function inferAnalyticType (dataSource: IRow[], fid: string): IAnalyticType {
  return dataSource.every((row) => {
    // TODO: 推断逻辑抽象一下
        return !isNaN(Number(row[fid])) || row[fid] === undefined
    })
    ? 'measure'
    : 'dimension'
}

function inferAnalyticTypeFromSemanticType (semanticType: ISemanticType): IAnalyticType {
  switch (semanticType) {
    case 'quantitative':
      return 'measure';
    default:
      return 'dimension'
  }
}

function isSetEqual (A: string[], B: string[]) {
  if (A.length !== B.length) return false;
  const bset = new Set(B);
  for (let a of A) {
    if (!bset.has(a)) return false;
  }
  return true;
}

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

export {
  isASCII,
  inferAnalyticType,
  inferAnalyticTypeFromSemanticType,
  isSetEqual,
  FileLoader,
  deepcopy,
  Transform
}