import { IAnalyticType, IDataType, ISemanticType, UnivariateSummary } from 'visual-insights';
import { IFieldMeta, IFilter } from '@kanaries/loa';
import { IRow, ICol, IVegaSubset } from '../interfaces';
import { RATH_INDEX_COLUMN_KEY } from '../constants';
import { isDateTimeArray } from '../dev/workers/engine/dateTimeExpand';
import * as FileLoader from './fileParser';
import * as Transform from './transform';
import { getRange } from './stat';
import deepcopy from './deepcopy';

interface IFieldId { fid: string }
export function colFromIRow(from: readonly IRow[], fields?: string[] | IFieldId[]): Map<string, ICol<any>> {
  let col = new Map<string, ICol<any>>();
  if (fields === undefined) {
    if (from.length === 0) return col;
    fields = Object.keys(from[0]);
  }
  else if (fields.length === 0) return col;
  else if (!(fields instanceof String)) fields = fields.map(f => (f as IFieldId).fid);
  const fieldIds = fields as string[];
  fieldIds.forEach(fid => {
    col.set(fid, { fid, data: from.map(data => data[fid]) } as ICol<any>);
  })
  return col;
}
export function rowFromICol(from: Map<string, ICol<any>>, fields: string[] | IFieldId[]): IRow[] {
  let row = new Array<IRow>();
  if (fields.length === 0) return row;
  else if (!(fields instanceof String)) fields = fields.map(f => (f as IFieldId).fid);
  const fieldIds = fields as string[];
  if (!fieldIds.map(fid => from.get(fid)?.data.length).every((v, i, array) => v === array[0])) {
    throw new Error("[col2row]: lengths not match")
  }
  for (let fid of fieldIds) {
    let col = from.get(fid) as ICol<any>;
    for (let i = 0; i < col.data.length; ++i) {
      row[i][fid] = col.data[i];
    }
  }
  return row;
}

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
 export function inferSemanticType (data: IRow[], fid: string): ISemanticType {
  let st = UnivariateSummary.getFieldType(data, fid);
  if (st === 'nominal') {
    if (isDateTimeArray(data.map(row => row[fid]))) st = 'temporal'
  }
  else if (st === 'ordinal') {
    const valueSet: Set<number> = new Set();
    let _max = -Infinity;
    let _min = Infinity;
    for (let v of valueSet) {
      _max = Math.max(_max, v)
      _min = Math.max(_min, v)
    }
    if (_max - _min + 1 !== valueSet.size) {
      st = 'quantitative'
    }
  }
  return st;
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

export function throttle<F extends (...args: any[]) => any> (func: F, delay: number) {
  let timer: number | null = null;
  return function (...args: Parameters<F>): Promise<ReturnType<F>> | null {
    if (timer === null) {
      return new Promise<ReturnType<F>>(resolve => {
        timer = window.setTimeout(() => {
          resolve(func(...args));
          timer = null;
        }, delay);
      });
    } else {
      return null;
    }
  }
}

export const readableWeekday = (W: number): string => {
  // 前面带上数字保证 vega 排序合理
  return ['0 Sun', '1 Mon', '2 Tue', '3 Wed', '4 Thu', '5 Fri', '6 Sat'][W];
};

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

export interface ISearchInfoBase {
  fields: IFieldMeta[];
  filters?: IFilter[];
  spec?: IVegaSubset | null;
}
export function searchFilterView<T extends ISearchInfoBase> (searchContent: string, views: T[]) {
  const words = searchContent.split(/[\s,;\t]+/)
  const lookupPattern = new RegExp(`.*${words.map(w => `(${w})`).join('|')}.*`, 'i')
  return views.filter(view => {
      for (let field of view.fields) {
          if (field.name && lookupPattern.test(field.name)) return true;
          if (lookupPattern.test(field.fid)) return true;
          if (view.filters && view.filters.length > 0) {
              for (let filter of view.filters) {
                  if (filter.type === 'set') {
                      if (filter.values.some(v => lookupPattern.test(v))) return true;
                  }
              }
          }
      }
      return false
  })
}