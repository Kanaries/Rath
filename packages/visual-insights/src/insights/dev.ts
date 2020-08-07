import { DataSource} from "../commonTypes";
import { getMeaSetsBasedOnClusterGroups, getDimClusterGroups } from './subspaces';
import { CrammersVThreshold, PearsonCorrelation } from './config';
import { Cluster, Outier } from '../ml/index';
import { crammersV, getCombination, pearsonCC, linearMapPositive } from '../statistics/index';
import { CHANNEL } from '../constant';
import { entropy, normalize } from '../statistics/index';
import aggregate, { createCube } from 'cube-core';
import { oneDLinearRegression } from '../statistics/index'
import { GroupIntention } from "./intention/groups";

const SPLITER = '=;=';
export interface ViewSpace {
  dimensions: string[];
  measures: string[];
}
export interface InsightSpace {
  dimensions: string[];
  measures: string[];
  type?: string;
  order?: 'desc' | 'asc';
  score?: number;
  significance: number;
  impurity?: number;
  description?: any
}
export type IntentionWorker = (aggData: DataSource, dimensions: string[], measures: string[]) => Promise<InsightSpace | null>;

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

function getCombinationFromClusterGroups(groups: string[][], limitSize: number = CHANNEL.maxDimensionNumber): string[][] {
  let fieldSets: string[][] = [];
  for (let group of groups) {
    let combineFieldSet: string[][] = getCombination(
      group,
      1,
      limitSize
    );
    fieldSets.push(...combineFieldSet);
  }
  return fieldSets;
}

export const getGeneralIntentionSpace: IntentionWorker = async function (aggData, dimensions, measures) {
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

export const getOutlierIntentionSpace: IntentionWorker = async function getOutlierIntentionSpace (aggData, dimensions, measures) {
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

export const getTrendIntentionSpace: IntentionWorker = async function (aggData, dimensions, measures) {
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

export const getGroupIntentionSpace: IntentionWorker = async function (aggData, dimensions, measures) {
  if (dimensions.length < 2) return null;
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

export class IntentionWorkerCollection {
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


export async function getIntentionSpaces (cubePool: Map<string, DataSource>, viewSpaces: ViewSpace[], Collection: IntentionWorkerCollection): Promise<InsightSpace[]> {
  let ansSpace: InsightSpace[] = []
  for (let space of viewSpaces) {
    const { dimensions, measures } = space;
    let key = dimensions.join(SPLITER);
    if (cubePool.has(key)) {
      let aggData = cubePool.get(key);
      let generalSpace = await getGeneralIntentionSpace(aggData, dimensions, measures);
      Collection.each(async (iWorker, name) => {
        try {
          let iSpace = await iWorker(aggData, dimensions, measures);
          if (iSpace !== null) {
            iSpace.type = name;
            iSpace.impurity = generalSpace.impurity;
            ansSpace.push(iSpace);
          }
        } catch (error) {
          console.error('worker failed', { dimensions, measures, aggData }, error);
        }
      })
    }
  }
  return ansSpace;
}
interface VisSpaceProps {
  dataSource: DataSource;
  dimensions: string[];
  measures: string[];
  collection?: IntentionWorkerCollection;
  dimension_correlation_threshold?: number;
  measure_correlation_threshold?: number;
  max_dimension_num_in_view?: number;
  max_measure_num_in_view?: number;
}
export async function getVisSpaces (props: VisSpaceProps): Promise<InsightSpace[]> {
  const {
    dataSource,
    dimensions,
    measures,
    collection,
    dimension_correlation_threshold = CrammersVThreshold,
    measure_correlation_threshold = PearsonCorrelation.strong,
    max_dimension_num_in_view = 3,
    max_measure_num_in_view = 3,
  } = props;
  // 1. get dimension cluster groups.
  // 2. get measure cluster groups.
  // 3. get dimension groups * measure groups = subspaces + aggregate
  // 4. calculate each subspace intention score (entropy, outlier, trend for temporal & oridinal field)
  // 5. filter each intend subspaces with threadshold
  // 6.manage those spaces / order them.
  let visableDimensions = dimensions;//.filter(dim => !isFieldUnique(dataSource, dim));
  let dimensionGroups = getDimClusterGroups(dataSource, visableDimensions, dimension_correlation_threshold);
  // let dimensionSets = getDimSetsFromClusterGroups(dimensionGroups);
  let dimensionSets = getCombinationFromClusterGroups(dimensionGroups, max_dimension_num_in_view);
  let measureGroups = getMeaSetsBasedOnClusterGroups(dataSource, measures, measure_correlation_threshold);
  let measureSets = getCombinationFromClusterGroups(measureGroups, max_measure_num_in_view);
  let viewSpaces = crossGroups(dimensionSets, measureSets);
  let cubePool: Map<string, DataSource> = new Map();
  // for (let group of dimensionGroups) {
  // todo: similar cuboids computation using cube-core
  let t0 = new Date().getTime();
  for (let group of dimensionSets) {
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
  let t1 = new Date().getTime();
  console.log('cube cost', t1 - t0);
  cubePool.set('*', dataSource);
  const usedCollection = collection || IntentionWorkerCollection.init();;
  // usedCollection.enable(DefaultIWorker.cluster, false);
  let ansSpace: InsightSpace[] = await getIntentionSpaces(cubePool, viewSpaces, usedCollection);
  return ansSpace;
}