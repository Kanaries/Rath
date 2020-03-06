import { DataSource, View } from "../commonTypes";
import { getDimSetsBasedOnClusterGroups, getMeaSetsBasedOnClusterGroups, getDimClusterGroups } from './subspaces';
import { CrammersVThreshold } from './config';
import { Cluster, Outier } from '../ml/index';
import { crammersV, getCombination, pearsonCC, linearMapPositive } from '../statistics/index';
import { CHANNEL } from '../constant';
import { entropy, normalize } from '../statistics/index';
import aggregate, { createCube } from 'cube-core';
import { momentCube } from "cube-core/built/core";
import { isFieldContinous, isFieldTime } from '../utils/common';
import { oneDLinearRegression } from '../statistics/index'
import { GroupIntention } from "./intention/groups";
const SPLITER = '=;=';
interface ViewSpace {
  dimensions: string[];
  measures: string[];
}
export interface InsightSpace {
  dimensions: string[];
  measures: string[];
  type: 'general' | 'trend' | 'outlier' | 'group';
  order: 'desc' | 'asc';
  score: number;
  significance: number;
  description?: any
}
function crossGroups(dimensionGroups: string[][], measureGroups: string[][]): ViewSpace[] {
  let viewSpaces: ViewSpace[] = [];
  for (let dimensions of dimensionGroups) {
    for (let measures of measureGroups) {
      viewSpaces.push({
        dimensions,
        measures
      });
    }
  }
  return viewSpaces;
}

function getDimSetsFromClusterGroups(groups: string[][]): string[][] {
  let dimSets: string[][] = [];
  for (let group of groups) {
    let combineDimSet: string[][] = getCombination(group, 1, CHANNEL.maxDimensionNumber);
    dimSets.push(...combineDimSet);
  }
  return dimSets;
}

export function getGeneralIntentionSpaces (cubePool: Map<string, DataSource>, viewSpaces: ViewSpace[]): InsightSpace[] {
  let ansSpace: InsightSpace[] = []
  for (let space of viewSpaces) {
    const { dimensions, measures } = space;
    let key = dimensions.join(SPLITER);
    if (cubePool.has(key)) {
      let aggData = cubePool.get(key);
      let score = 0;
      let significance = 0;
      for (let mea of measures) {
        let fL = aggData.map(r => r[mea]);
        let pL = normalize(linearMapPositive(fL));
        let value = entropy(pL);
        score += value;
        significance += value / Math.log2(fL.length)
      }
      score /= measures.length;
      significance /= measures.length;
      significance = 1 - significance;
      let insightSpace: InsightSpace = {
        dimensions,
        measures,
        type: 'general',
        score,
        significance,
        order: 'asc'
      }
      ansSpace.push(insightSpace);
    }
  }
  return ansSpace;
}

export function getOutlierIntentionSpaces (cubePool: Map<string, DataSource>, viewSpaces: ViewSpace[]): InsightSpace[] {
  let ansSpace: InsightSpace[] = [];
  for (let space of viewSpaces) {
    const { dimensions, measures } = space;
    let key = measures.length >= 2 ? '*' : dimensions.join(SPLITER);
    if (cubePool.has(key)) {
      let aggData = cubePool.get(key);
      let iForest = new Outier.IsolationForest([], measures, aggData);
      iForest.buildIsolationForest();
      let scoreList = iForest.estimateOutierScore();
      // let rankScoreList = scoreList.map((s, i) => ({
      //   score: s,
      //   index: i
      // }));
      // rankScoreList.sort((a, b) => b.score - a.score);
      let maxIndex = 0;
      let score = 0;
      for (let i = 0; i < scoreList.length; i++) {
        if (scoreList[i] > score) {
          score = scoreList[i];
          maxIndex = i;
        }
      }
      let des: {[key: string]: any} = {};
      dimensions.concat(measures).forEach(mea => { des[mea] = aggData[maxIndex][mea]; })
      let insightSpace: InsightSpace = {
        dimensions,
        measures,
        type: 'outlier',
        score,
        significance: score,
        order: 'desc',
        description: des//rankScoreList.slice(0, 10).map(s => aggData[s.index])
      }
      ansSpace.push(insightSpace);
    }
  }
  return ansSpace;
}

export function getTrendIntentionSpaces (cubePool: Map<string, DataSource>, viewSpaces: ViewSpace[]): InsightSpace[] {
  let ansSpace: InsightSpace[] = [];
  for (let space of viewSpaces) {
    const { dimensions, measures } = space;
    let key = dimensions.join(SPLITER);
    if (cubePool.has(key)) {
      let aggData = cubePool.get(key);
      let orderedData = [...aggData];
      orderedData.sort((a, b) => {
        if (a[dimensions[0]] > b[dimensions[0]]) return 1;
        if (a[dimensions[0]] === b[dimensions[0]]) return 0;
        if (a[dimensions[0]] < b[dimensions[0]]) return -1;
      });
      let score = 0;
      for (let mea of measures) {
        let linearModel = new oneDLinearRegression(orderedData, dimensions[0], mea);
        linearModel.normalizeDimensions(dimensions);
        score += linearModel.significance();
      }
      score /= measures.length;
      let insightSpace: InsightSpace = {
        dimensions,
        measures,
        type: 'trend',
        score,
        significance: score,
        order: 'desc'
      }
      ansSpace.push(insightSpace);
    }
  }
  return ansSpace;
}

export function getGroupIntentionSpaces (cubePool: Map<string, DataSource>, viewSpaces: ViewSpace[]): InsightSpace[] {
  let ansSpace: InsightSpace[] = [];
  for (let space of viewSpaces) {
    const { dimensions, measures } = space;
    let key = dimensions.join(SPLITER);
    if (cubePool.has(key)) {
      let aggData = cubePool.get(key);
      let score = 0;
      let groupIntention = new GroupIntention({
        dataSource: aggData,
        dimensions,
        measures,
        K: 8
      });
      score = groupIntention.getSignificance(measures.concat(dimensions.slice(0, -1)), dimensions.slice(-1));
      let insightSpace: InsightSpace = {
        dimensions,
        measures,
        type: 'group',
        score,
        significance: score,
        order: 'desc'
      }
      ansSpace.push(insightSpace);
    }
  }
  return ansSpace;
}

export function getVisSpaces (dataSource: DataSource, dimensions: string[], measures: string[]): InsightSpace[] {
  // 1. get dimension cluster groups.
  // 2. get measure cluster groups.
  // 3. get dimension groups * measure groups = subspaces + aggregate
  // 4. calculate each subspace intention score (entropy, outlier, trend for temporal & oridinal field)
  // 5. filter each intend subspaces with threadshold
  // 6.manage those spaces / order them.
  let ansSpace: InsightSpace[] = [];
  let dimensionGroups = getDimClusterGroups(dataSource, dimensions);
  let dimensionSets = getDimSetsFromClusterGroups(dimensionGroups);
  let measureGroups = getMeaSetsBasedOnClusterGroups(dataSource, measures);
  let viewSpaces = crossGroups(dimensionSets, measureGroups);
  let cubePool: Map<string, DataSource> = new Map();
  for (let group of dimensionGroups) {
    let key = group.join(SPLITER);
    let aggData = aggregate({
      dataSource,
      dimensions: group,
      measures,
      asFields: measures,
      operator: 'sum'
    });
    cubePool.set(key, aggData);
  }
  cubePool.set('*', dataSource);
  ansSpace.push(...getGeneralIntentionSpaces(cubePool, viewSpaces));
  ansSpace.push(...getOutlierIntentionSpaces(cubePool, viewSpaces));
  ansSpace.push(...getGroupIntentionSpaces(cubePool, viewSpaces));
  let trendSpaces = viewSpaces.filter(space => space.dimensions.length === 1)
    // .filter(space => {
    //   return isFieldContinous(dataSource, space.dimensions[0]) || isFieldTime(dataSource, space.dimensions[0])
    // })
  ansSpace.push(...getTrendIntentionSpaces(cubePool, trendSpaces));
  return ansSpace;
}