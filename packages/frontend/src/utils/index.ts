import * as FileLoader from './fileParser';
import * as Transform from './transform';
import useComposeState from './useComposeState';
import deepcopy from './deepcopy';
import { IRow } from '../interfaces';
// TODO: Rath和VI中都有一套，弱约束关联，可能带来潜在的迭代负担或bug
import { IAnalyticType, ISemanticType } from 'visual-insights/build/esm/insights/InsightFlow/interfaces';

export function isASCII(str: string) {
  return /^[\x00-\x7F]*$/.test(str)
}


export function inferAnalyticType (dataSource: IRow[], fid: string): IAnalyticType {
  return dataSource.every((row) => {
    // TODO: 推断逻辑抽象一下
        return !isNaN(Number(row[fid])) || row[fid] === undefined
    })
    ? 'measure'
    : 'dimension'
}

export function inferAnalyticTypeFromSemanticType (semanticType: ISemanticType): IAnalyticType {
  switch (semanticType) {
    case 'quantitative':
      return 'measure';
    default:
      return 'dimension'
  }
}

export {
  FileLoader,
  useComposeState,
  deepcopy,
  Transform
}