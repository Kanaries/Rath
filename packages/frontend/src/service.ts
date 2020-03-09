import { DataSource,  Field, FieldType, OperatorType } from './global';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import dashBoardGeneratorWorker from './workers/dashboard.worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import clusterWorker from './workers/cluster.worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import combineFieldsWorker from './workers/combineFields.worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import fieldsSummaryWorker from './workers/fieldsSummary.worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import groupFieldsWorker from './workers/groupFields.worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import InsightViewWorker from './workers/dev.worker';
import { InsightSpace } from 'visual-insights/build/esm/insights/dev';

let server = '//lobay.moe:8443';

if (process.env.NODE_ENV !== 'production') {
  console.log('using dev server');
  server = '//localhost:8000';
}

interface SuccessResult<T> {
  success: true;
  data: T;
}
interface FailResult<T> {
  success: false;
  message: string;
}

type Result<T> = SuccessResult<T> | FailResult<T>;

function workerService<T, R> (worker: Worker, data: R): Promise<Result<T>> {
  return new Promise<Result<T>>((resolve, reject) => {
    worker.postMessage(data);
    worker.onmessage = (e: MessageEvent) => {
      resolve(e.data)
    }
    worker.onerror = (e: ErrorEvent) => {
      reject({
        success: false,
        message: e.error
      })
    }
  })
}

export interface View {
  groups: string[][];
  detail: [string[], any, number[][]];
  score: number;
}

/**
 * statistic description for a field
 */
export interface FieldSummary {
  fieldName: string;
  entropy: number;
  maxEntropy: number;
  distribution: Array<{ memberName: string; count: number }>
  type: FieldType
}
export async function getFieldsSummaryService (dataSource: DataSource, fields: string[] | Field[], useServer?: boolean): Promise<FieldSummary[]> {
  let fieldSummaryList: FieldSummary[] = [];
  if (useServer) {
    try {
      const res = await fetch(server + '/api/service/fieldsSummary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dataSource,
          fields
        })
      })
      const result: Result<FieldSummary[]> = await res.json();
      if (result.success === true) {
        fieldSummaryList = result.data;
      } else {
        throw new Error('[fields summary failed]' + result.message)
      }
    } catch (error) {
      console.error(error)
    }
  } else {
    const worker = new fieldsSummaryWorker();
    const result = await workerService<FieldSummary[], any>(worker, { dataSource, fields });
    if (result.success === true) {
      fieldSummaryList = result.data;
    } else {
      throw new Error('[fields summary failed]' + result.message)
    }
    worker.terminate()
  }
  return fieldSummaryList
}

interface GroupFieldsResponse {
  groupedData: DataSource;
  newFields: Field[];
  fields: Field[];
}
export async function getGroupFieldsService (dataSource: DataSource, fields: Field[], useServer?: boolean): Promise<GroupFieldsResponse> {
  let ans: GroupFieldsResponse = {
    groupedData: [],
    newFields: [],
    fields: []
  };
  if (useServer) {
    try {
      const res = await fetch(server + '/api/service/groupFields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dataSource,
          fields
        })
      })
      const result: Result<GroupFieldsResponse> = await res.json();
      if (result.success === true) {
        ans = result.data;
      } else {
        throw new Error('[group fields failed]' + result.message)
      }
    } catch (error) {
      console.error(error)
    }
  } else {
    const worker = new groupFieldsWorker();
    const result = await workerService<GroupFieldsResponse, any>(worker, { dataSource, fields });
    if (result.success === true) {
      ans = result.data;
    } else {
      throw new Error('[group fields failed]' + result.message)
    }
    worker.terminate();
  }
  return ans;
}

export interface Subspace {
  score: number;
  dimensions: string[];
  measures: Array<{name: string; value: number}>;
  correlationMatrix: number[][];
}
export async function combineFieldsService (dataSource: DataSource, dimensions: string[], measures: string[], operator: OperatorType, useServer?: boolean): Promise<Subspace[]> {
  let subspaceList: Subspace[] = [];
  if (useServer) {
    try {
      const res = await fetch(server + '/api/service/combineFields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dataSource,
          dimensions,
          measures,
          operator
        })
      })
      const result: Result<Subspace[]> = await res.json();
      if (result.success === true) {
        subspaceList = result.data;
      } else {
        throw new Error('[combine fields failed]' + result.message)
      }
    } catch (error) {
      console.error(error)
    }
  } else {
    const worker = new combineFieldsWorker();
    const result = await workerService<Subspace[], any>(worker, { dataSource, dimensions, measures, operator });
    if (result.success === true) {
      subspaceList = result.data;
    } else {
      throw new Error('[combine fields failed]' + result.message)
    }
    worker.terminate()
  }
  return subspaceList
}

export interface ViewCombinedSpace {
  dimensions: string[];
  measures: Array<{name: string; value: number}>;
  matrix: number[][];
}

export interface ViewSpace {
  index: number;
  dimensions: string[];
  measures: string[];
  score: number;
}

export async function clusterMeasures (maxGroupNumber: number, combinedSpaces: ViewCombinedSpace[], useServer?: boolean): Promise<ViewSpace[]> {
  let viewSpaces: ViewSpace[] = [];
  if (useServer) {
    try {
      const res = await fetch(server + '/api/service/clusterMeasures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxGroupNumber,
          spaces: combinedSpaces
        })
      });
      const result: Result<ViewSpace[]> = await res.json();
      if (result.success === true) {
        viewSpaces = result.data.map((v, i) => {
          return {
            ...v,
            index: i
          }
        });
      } else {
        throw new Error('[cluster measures]' + result.message)
      }
    } catch (error) {
      console.error(error)
    }
  } else {
    const worker = new clusterWorker();
    const result = await workerService<ViewSpace[], any>(worker, { maxGroupNumber, spaces: combinedSpaces });
    if (result.success === true) {
      viewSpaces = result.data.map((v, i) => {
        return {
          ...v,
          index: i
        }
      });
    } else {
      throw new Error('[cluster measures]' + result.message)
    }
    worker.terminate();
  }
  return viewSpaces;
}

interface ViewInDashBoard {
  type: string;
  dimensions: string[];
  measures: string[];
}

export type DashBoard = ViewInDashBoard[];

export async function generateDashBoard (dataSource: DataSource, dimensions: string[], measures: string[], subspaces: Subspace[], useServer?: boolean): Promise<DashBoard[]> {
  let dashBoardList: DashBoard[] = [];
  if (useServer) {
    try {
      const res =  await fetch(server + '/api/service/generateDashBoard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dataSource,
          dimensions,
          measures,
          subspaces
        })
      });
      const result = await res.json();
      if (result.success) {
        dashBoardList = result.data;
      } else {
        throw new Error('[generateDashBoard]' + result.message);
      }
    } catch (error) {
      console.error(error)
    }
  } else {
    const worker = new dashBoardGeneratorWorker();
    const result = await workerService<DashBoard[], any>(worker, {
        dataSource,
        dimensions,
        measures,
        subspaces
      });
    if (result.success) {
      dashBoardList = result.data;
    } else {
      throw new Error('[generateDashBoard]' + result.message);
    }
    worker.terminate()
  }
  
  return dashBoardList;
}

export async function getInsightViewSpace (dataSource: DataSource, dimensions: string[], measures: string[]): Promise<InsightSpace[]> {
  let ansSpace: InsightSpace[] = [];
  try {
    const worker = new InsightViewWorker();
    const result = await workerService<InsightSpace[], any>(worker, {
      dataSource,
      dimensions,
      measures
    });
    if (result.success) {
      ansSpace = result.data;
    } else {
      throw new Error('[getInsightViewSpace]' + result.message);
    }
    worker.terminate();
  } catch (error) {
    console.error(error);
  }
  return ansSpace;
}