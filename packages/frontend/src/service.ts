import { Field, OperatorType } from './global';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import dashBoardGeneratorWorker from './workers/dashboard.worker?worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import clusterWorker from './workers/cluster.worker?worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import combineFieldsWorker from './workers/combineFields.worker?worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import fieldsSummaryWorker from './workers/fieldsSummary.worker?worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import groupFieldsWorker from './workers/groupFields.worker?worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import InsightViewWorker from './workers/dev.worker?worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import RathEngineWorker from './workers/engine/index.worker?worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import InferMetaWorker from './workers/metaInfer.worker?worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import FootmanWorker from './workers/footman/index.worker?worker';
import { InsightSpace } from 'visual-insights/build/esm/insights/dev';
import { MessageProps } from './workers/engine/service';

import { IFieldMeta, IMuteFieldBase, IRawField, IRow } from './interfaces';
import { ISemanticType } from 'visual-insights';
import { IFootmanProps } from './workers/footman/service';

interface SuccessResult<T> {
  success: true;
  data: T;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface FailResult<T> {
  success: false;
  message: string;
}

type Result<T> = SuccessResult<T> | FailResult<T>;

export function workerService<T, R> (worker: Worker, data: R): Promise<Result<T>> {
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

const rathGlobalWorkerRef: { current: Worker | null } = {
  current: null
}

export function getRathWorker (): Worker {
  if (rathGlobalWorkerRef.current === null) {
    console.log('create another')
    throw new Error('Worker is not created.')
  } return rathGlobalWorkerRef.current!
}

export function destroyRathWorker () {
  if (rathGlobalWorkerRef.current) {
    rathGlobalWorkerRef.current.terminate();
    rathGlobalWorkerRef.current = null;
  }
}

export function initRathWorker (engineMode: string) {
  if (rathGlobalWorkerRef.current === null) {
    // if (engineMode === COMPUTATION_ENGINE.clickhouse) {
    //   rathGlobalWorkerRef.current = new RathCHEngine();
    // } else {
    //   rathGlobalWorkerRef.current = new RathEngineWorker();
    // }
    rathGlobalWorkerRef.current = new RathEngineWorker();
  }
}

export async function rathEngineService (props: MessageProps) {
  const worker = getRathWorker();
  const res = await workerService<any, MessageProps>(worker, props)
  if (res.success) {
    return res.data
  } else {
    throw new Error(res.message);
  }
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
  type: ISemanticType
}
export async function getFieldsSummaryService (dataSource: IRow[], fields: string[] | Field[], useServer?: boolean): Promise<FieldSummary[]> {
  let fieldSummaryList: FieldSummary[] = [];
  if (useServer) {
    try {
      const res = await fetch(getTestServerUrl() + '/api/service/fieldsSummary', {
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
    try {
      const result = await workerService<FieldSummary[], any>(worker, { dataSource, fields });
      if (result.success === true) {
        fieldSummaryList = result.data;
      } else {
        throw new Error('[fields summary failed]' + result.message)
      }
    } catch (error) {
      console.error(error)
    }
    worker.terminate()
  }
  return fieldSummaryList
}

interface GroupFieldsResponse {
  groupedData: IRow[];
  newFields: Field[];
  fields: Field[];
}
export async function getGroupFieldsService (dataSource: IRow[], fields: Field[], useServer?: boolean): Promise<GroupFieldsResponse> {
  let ans: GroupFieldsResponse = {
    groupedData: [],
    newFields: [],
    fields: []
  };
  if (useServer) {
    try {
      const res = await fetch(getTestServerUrl() + '/api/service/groupFields', {
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
export async function combineFieldsService (dataSource: IRow[], dimensions: string[], measures: string[], operator: OperatorType, useServer?: boolean): Promise<Subspace[]> {
  let subspaceList: Subspace[] = [];
  if (useServer) {
    try {
      const res = await fetch(getTestServerUrl() + '/api/service/combineFields', {
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
      const res = await fetch(getTestServerUrl() + '/api/service/clusterMeasures', {
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

interface IDashBoardServiceProps{
  dataSource: IRow[];
  dimensions: string[];
  measures: string[];
  subspaces: Subspace[];
  useServer?: boolean;
}
export async function generateDashBoard (props: IDashBoardServiceProps): Promise<DashBoard[]> {
  const {
    dataSource,
    dimensions,
    measures,
    subspaces,
    useServer
  } = props;
  const reqBody: {[key: string]: any} = {
    dataSource,
    dimensions,
    measures,
    subspaces
  }
  let dashBoardList: DashBoard[] = [];
  if (useServer) {
    try {
      const res =  await fetch(getTestServerUrl() + '/api/service/generateDashBoard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqBody)
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
    const result = await workerService<DashBoard[], any>(worker, reqBody);
    if (result.success) {
      dashBoardList = result.data;
    } else {
      throw new Error('[generateDashBoard]' + result.message);
    }
    worker.terminate()
  }
  
  return dashBoardList;
}

export async function getInsightViewSpace (dataSource: IRow[], dimensions: string[], measures: string[]): Promise<InsightSpace[]> {
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

export interface InferMetaServiceProps {
  dataSource: IRow[];
  fields: IMuteFieldBase[];
}
export async function inferMetaService(props: InferMetaServiceProps): Promise<IRawField[]> {
  let metas: IRawField[] = [];
  try {
    const worker = new InferMetaWorker();
    const result = await workerService<IRawField[], InferMetaServiceProps>(worker, props);
    if (result.success) {
      metas = result.data
    } else {
      throw new Error('[meta infer worker]' + result.message);
    }
    worker.terminate();
  } catch (error) {
    console.error(error)
  }
  return metas;
}

export interface MessageServerProps extends MessageProps {
  dataSource: IRow[];
  fields: IFieldMeta[];
}

function getTestServerUrl (): URL | null {
  const url = new URL(window.location.href).searchParams.get('server');
  if (url !== null) {
    return new URL(url);
  }
  return null;
}
export async function rathEngineServerService (props: MessageServerProps) {
  try {
    const testServer = getTestServerUrl();
    if (testServer) {
      testServer.pathname = props.task;
    } else {
      throw new Error('url does not contains params called "server="');
    }
    const res = await fetch(testServer.href, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(props)
    });
    const result = await res.json();
    if (result.success) {
      return result.data;
    } else {
      throw new Error(`[result.fail] ${result.message}`);
    }
  } catch (error) {
    // throw error;
    console.error(error)
  }
}

export async function footmanEngineService<R = any> (props: IFootmanProps, mode: 'server' | 'local' = 'local'): Promise<R> {
  try {
    if (mode === 'server') {
      const testServer = getTestServerUrl();
      if (testServer) {
        testServer.pathname = props.task;
      } else {
        throw new Error('url does not contains params called "server="');
      }
      const res = await fetch(testServer.href, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(props)
      });
      const result = await res.json();
      if (result.success) {
        return result.data as R;
      } else {
        throw new Error(`[result.fail] ${result.message}`);
      }
    } else {
      const worker = new FootmanWorker();
      const result = await workerService<R, IFootmanProps>(worker, props);
      worker.terminate();
      if (result.success) {
        return result.data
      } else {
        throw new Error('[meta infer worker]' + result.message);
      }
    }
  } catch (error) {
    console.error(error)
    throw error;
  }
}

interface ExtendDataProps {
  dataSource: IRow[];
  fields: IRawField[];
}
export async function extendDataService (props: ExtendDataProps): Promise<ExtendDataProps> {
  try {
    const res = await fetch('http://localhost:8000/extension', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(props)
    })
    const result = await res.json();
    if (result.success) {
      return result.data as ExtendDataProps
    }
    throw new Error(result.message)
  } catch (error) {
    return props;
  }
}