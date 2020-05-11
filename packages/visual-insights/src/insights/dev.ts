import { DataSource, View } from "../commonTypes";
import { getDimSetsBasedOnClusterGroups, getMeaSetsBasedOnClusterGroups, getDimClusterGroups } from './subspaces';
import { CrammersVThreshold } from './config';
import { Cluster, Outier } from '../ml/index';
import { crammersV, getCombination, pearsonCC, linearMapPositive } from '../statistics/index';
import { CHANNEL } from '../constant';
import { entropy, normalize } from '../statistics/index';
import aggregate, { createCube } from 'cube-core';
import { momentCube } from "cube-core/built/core";
import { isFieldContinous, isFieldTime, isFieldUnique } from '../utils/common';
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
  type?: string;
  order: 'desc' | 'asc';
  score: number;
  significance: number;
  impurity?: number;
  description?: any
}
export type IntentionWorker = (aggData: DataSource, dimensions: string[], measures: string[]) => InsightSpace | null;

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

export function getGeneralIntentionSpace (aggData: DataSource, dimensions: string[], measures: string[]): InsightSpace {
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
  return {
    dimensions,
    measures,
    type: 'default_general',
    score,
    impurity: score,
    significance,
    order: 'asc'
  }
}

export function getOutlierIntentionSpace (aggData: DataSource, dimensions: string[], measures: string[]): InsightSpace {
  let iForest = new Outier.IsolationForest([], measures, aggData);
  iForest.buildIsolationForest();
  let scoreList = iForest.estimateOutierScore();
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
  return {
    dimensions,
    measures,
    score,
    significance: score,
    order: 'desc',
    description: des
  }
}

export function getTrendIntentionSpace (aggData: DataSource, dimensions: string[], measures: string[]): InsightSpace | null {
  if (dimensions.length !== 1) return null;
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
  return {
    dimensions,
    measures,
    score,
    significance: score,
    order: 'desc'
  }
}

export function getGroupIntentionSpace (aggData: DataSource, dimensions: string[], measures: string[]): InsightSpace {
  let score = 0;
  let groupIntention = new GroupIntention({
    dataSource: aggData,
    dimensions,
    measures,
    K: 8
  });
  score = groupIntention.getSignificance(measures.concat(dimensions.slice(0, -1)), dimensions.slice(-1));
  return {
    dimensions,
    measures,
    score,
    significance: score,
    order: 'desc'
  }
}

// export const IntentionWorkerCollection: Map<string, IntentionWorker> = new Map();
export enum DefaultIWorker {
  outlier = "default_outlier",
  cluster = "default_group",
  trend = "default_trend"
}

class IntentionWorkerCollection {
  public static colletion: IntentionWorkerCollection;
  private workers: Map<string, [boolean, IntentionWorker]>;
  private constructor() {
    this.workers = new Map();
  }
  public register (name: string, iWorker: IntentionWorker) {
    if (this.workers.has(name)) {
      throw new Error(`There has been a worker named: ${name} already.`);
    } else { 
      this.workers.set(name, [true, iWorker])
    }
  }
  public enable (name: string, status: boolean) {
    if (!this.workers.has(name)) {
      throw new Error(`Intention Worker "${name}" does not exist.`)
    } else {
      let iWorkerWithStatus = this.workers.get(name);
      iWorkerWithStatus[0] = status;
      this.workers.set(name, iWorkerWithStatus);
    }
  }
  public each (func: (iWorker: IntentionWorker, name?: string) => void) {
    for (let [name, iWorker] of this.workers) {
      if (iWorker[0]) {
        func(iWorker[1], name)
      }
    }
  }
  public static init(props: { withDefaultIWorkers?: boolean } = { withDefaultIWorkers: true}) {
    const { withDefaultIWorkers = true } = props;
    if (!IntentionWorkerCollection.colletion) {
      IntentionWorkerCollection.colletion = new IntentionWorkerCollection();
      if (withDefaultIWorkers) {
        IntentionWorkerCollection.colletion.register(DefaultIWorker.outlier, getOutlierIntentionSpace)
        IntentionWorkerCollection.colletion.register(DefaultIWorker.cluster, getGroupIntentionSpace)
        IntentionWorkerCollection.colletion.register(DefaultIWorker.trend, getTrendIntentionSpace)
      }
    }
    for (let key in DefaultIWorker) {
      IntentionWorkerCollection.colletion.enable(DefaultIWorker[key], withDefaultIWorkers)
    }
    return IntentionWorkerCollection.colletion;
  }
}


export function getIntentionSpaces (cubePool: Map<string, DataSource>, viewSpaces: ViewSpace[], Collection: IntentionWorkerCollection): InsightSpace[] {
  let ansSpace: InsightSpace[] = []
  for (let space of viewSpaces) {
    const { dimensions, measures } = space;
    let key = dimensions.join(SPLITER);
    if (cubePool.has(key)) {
      let aggData = cubePool.get(key);
      let generalSpace = getGeneralIntentionSpace(aggData, dimensions, measures);
      Collection.each((iWorker, name) => {
        let iSpace = iWorker(aggData, dimensions, measures);
        if (iSpace !== null) {
          iSpace.type = name;
          iSpace.impurity = generalSpace.impurity;
          ansSpace.push(iSpace);
        }
      })
    }
  }
  return ansSpace;
}

export function getVisSpaces (dataSource: DataSource, dimensions: string[], measures: string[], Collection?: IntentionWorkerCollection): InsightSpace[] {
  // 1. get dimension cluster groups.
  // 2. get measure cluster groups.
  // 3. get dimension groups * measure groups = subspaces + aggregate
  // 4. calculate each subspace intention score (entropy, outlier, trend for temporal & oridinal field)
  // 5. filter each intend subspaces with threadshold
  // 6.manage those spaces / order them.
  let visableDimensions = dimensions.filter(dim => isFieldUnique(dataSource, dim));
  let dimensionGroups = getDimClusterGroups(dataSource, visableDimensions);
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
  let ansSpace: InsightSpace[] = getIntentionSpaces(cubePool, viewSpaces, Collection || IntentionWorkerCollection.init());
  return ansSpace;
}