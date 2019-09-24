import {
  deepcopy,
  memberCount,
  groupCategoryField,
  groupContinousField,
  aggregate,
  isFieldCategory,
  isFieldContinous
} from './utils'

import fieldsAnalysis from './fieldAnalysis';
import { specification, visualElements } from './specification';

import {
  isUniformDistribution
} from './distribution';

import {
  normalize,
  entropy,
  gini
} from './impurityMeasure';

import getInsightViews, { analysisDimensions, getCombination } from './insights/index';
import { dropNull } from './cleaner/index';

export {
  deepcopy,
  memberCount,
  groupCategoryField,
  groupContinousField,
  aggregate,
  isFieldCategory,
  isFieldContinous,
  fieldsAnalysis,
  isUniformDistribution,
  normalize,
  entropy,
  gini,
  specification,
  visualElements,
  analysisDimensions,
  dropNull,
  getInsightViews,
  getCombination
}