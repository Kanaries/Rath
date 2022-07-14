import * as FileLoader from './fileParser';
import * as Transform from './transform';
import { getRange } from './stat';
import deepcopy from './deepcopy';
import { IRow } from '../interfaces';
// TODO: Rath和VI中都有一套，弱约束关联，可能带来潜在的迭代负担或bug
import { IAnalyticType, IDataType, ISemanticType, UnivariateSummary } from 'visual-insights';
import { RATH_INDEX_COLUMN_KEY } from '../constants';

function isASCII(str: string) {
  // eslint-disable-next-line no-control-regex
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

/**
 * 这里目前暂时包一层，是为了解耦具体的推断实现。后续这里要调整推断的逻辑。
 * 需要讨论这一层是否和交互层有关，如果没有关系，这一层包裹可以不存在这里，而是在visual-insights中。
 * @param data 原始数据
 * @param fid 字段id
 * @returns semantic type 列表
 */
 export function inferSemanticType (data: IRow[], fid: string) {
  return UnivariateSummary.getFieldType(data, fid);
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

interface IGeneralColumn {
  fid: string;
}
export function findRathSafeColumnIndex<T extends IGeneralColumn> (fields: T[]): number {
  return fields.findIndex(f => f.fid === RATH_INDEX_COLUMN_KEY);
}

export function throttle<F extends Function> (func: F, delay: number) {
  let timer: number | null = null;
  return function () {
    if (timer === null) {
      timer = window.setTimeout(() => {
        func();
        timer = null;
      }, delay);
    }
  }
}

export {
  isASCII,
  inferAnalyticType,
  inferAnalyticTypeFromSemanticType,
  isSetEqual,
  FileLoader,
  deepcopy,
  Transform,
  getRange
}