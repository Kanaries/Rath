/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import RathEngineWorker from '../workers/engine/index.worker?worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import InferMetaWorker from '../workers/metaInfer.worker?worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import LoaWorker from '../workers/loa/index.worker?worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import CleanWorker from '../workers/clean.worker?worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import FilterWorker from '../workers/filterData.worker?worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import LabDistVisWorker from '../workers/labDistVis.worker?worker';

import { MessageProps } from '../workers/engine/service';

import { CleanMethod, ICol, IFieldMeta, IFilter, IMuteFieldBase, IRawField, IRow } from '../interfaces';
import { ILoaProps } from '../workers/loa/service';
import { IteratorStorage } from '../utils/iteStorage';
import type { labDistVis } from '../queries/labdistVis';

interface SuccessResult<T> {
    success: true;
    data: T;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface FailResult {
    success: false;
    message: string;
}

export type Result<T> = SuccessResult<T> | FailResult;

export function workerService<T, R>(worker: Worker, data: R): Promise<Result<T>> {
    return new Promise<Result<T>>((resolve, reject) => {
        worker.postMessage(data);
        worker.onmessage = (e: MessageEvent) => {
            resolve(e.data);
        };
        worker.onerror = (e: ErrorEvent) => {
            reject({
                success: false,
                message: e.error,
            });
        };
    });
}

const rathGlobalWorkerRef: { current: Worker | null } = {
    current: null,
};

export function getRathWorker(): Worker {
    if (rathGlobalWorkerRef.current === null) {
        console.warn('create another');
        throw new Error('Worker is not created.');
    }
    return rathGlobalWorkerRef.current!;
}

export function destroyRathWorker() {
    if (rathGlobalWorkerRef.current) {
        rathGlobalWorkerRef.current.terminate();
        rathGlobalWorkerRef.current = null;
    }
}

export function initRathWorker(engineMode: string) {
    if (rathGlobalWorkerRef.current === null) {
        // if (engineMode === COMPUTATION_ENGINE.clickhouse) {
        //   rathGlobalWorkerRef.current = new RathCHEngine();
        // } else {
        //   rathGlobalWorkerRef.current = new RathEngineWorker();
        // }
        rathGlobalWorkerRef.current = new RathEngineWorker();
    }
}

export async function rathEngineService(props: MessageProps) {
    const worker = getRathWorker();
    const res = await workerService<any, MessageProps>(worker, props);
    if (res.success) {
        return res.data;
    } else {
        throw new Error(res.message);
    }
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
            metas = result.data;
        } else {
            throw new Error('[meta infer worker]' + result.message);
        }
        worker.terminate();
    } catch (error) {
        console.error(error);
    }
    return metas;
}

export type CleanServiceProps = {
    computationMode: 'inline' | 'offline';
    dataSource: IRow[];
    fields: IMuteFieldBase[];
    method: CleanMethod;
} | {
    computationMode: 'offline';
    fields: IMuteFieldBase[];
    method: CleanMethod;
    storage: IteratorStorage;
}
export async function cleanDataService(props: CleanServiceProps): Promise<IRow[]> {
    let data: IRow[] = [];
    try {
        const worker = new CleanWorker();
        const result = await workerService<IRow[], CleanServiceProps>(worker, props);
        if (result.success) {
            data = result.data;
        } else {
            throw new Error('[clean data worker]' + result.message);
        }
        worker.terminate();
    } catch (error) {
        console.error(error);
    }
    return data;
}

export type FilterServiceProps = {
    computationMode: 'inline';
    dataSource: IRow[];
    extData: Map<string, ICol<any>>;
    fields: readonly IRawField[];
    filters: IFilter[];
} | {
    computationMode: 'offline';
    dataStorage: IteratorStorage;
    resultStorage: IteratorStorage;
    extData: Map<string, ICol<any>>;
    fields: readonly IRawField[];
    filters: IFilter[];
}
/**
 * Merge `extData` with `dataSource` and filter data at the same time
 */
export async function filterDataService(props: FilterServiceProps): Promise<{rows: IRow[]; versionCode: number}> {
    let data: {rows: IRow[]; versionCode: number} = {
        rows: [],
        versionCode: -1
    };
    try {
        const worker = new FilterWorker();
        const result = await workerService<{rows: IRow[]; versionCode: number}, FilterServiceProps>(worker, props);
        if (result.success) {
            data = result.data;
        } else {
            throw new Error('[filter worker]' + result.message);
        }
        worker.terminate();
    } catch (error) {
        console.error(error);
    }
    return data;
}

export interface MessageServerProps extends MessageProps {
    dataSource: IRow[];
    fields: IFieldMeta[];
}

function getTestServerUrl(): URL | null {
    const url = new URL(window.location.href).searchParams.get('server');
    if (url !== null) {
        return new URL(url);
    }
    return null;
}

export function getTestServerAPI(api: string): string {
    const url = new URL(window.location.href).searchParams.get('server') || 'https://gateway.kanaries.net';
    let surl = new URL(url);
    surl.pathname = api;
    return surl.href;
}
export async function rathEngineServerService(props: MessageServerProps) {
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
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(props),
        });
        const result = await res.json();
        if (result.success) {
            return result.data;
        } else {
            throw new Error(`[result.fail] ${result.message}`);
        }
    } catch (error) {
        // throw error;
        console.error(error);
    }
}

export async function loaEngineService<R = any>(
    props: ILoaProps,
    mode: 'server' | 'local' = 'local'
): Promise<R> {
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
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(props),
            });
            const result = await res.json();
            if (result.success) {
                return result.data as R;
            } else {
                throw new Error(`[result.fail] ${result.message}`);
            }
        } else {
            const worker = new LoaWorker();
            const result = await workerService<R, ILoaProps>(worker, props);
            worker.terminate();
            if (result.success) {
                return result.data;
            } else {
                throw new Error('[meta infer worker]' + result.message);
            }
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export type ILabDistVisWorkerProps = Parameters<typeof labDistVis>[0];

export type ILabDistVisWorkerBatchProps = (
    & Pick<Parameters<typeof labDistVis>[0], 'dataSource'>
    & {
        items: Omit<Parameters<typeof labDistVis>[0], 'dataSource'>[];
    }
);

export async function labDistVisService<
    P extends ILabDistVisWorkerProps | ILabDistVisWorkerBatchProps,
    R extends P extends ILabDistVisWorkerProps ? ReturnType<typeof labDistVis> : ReturnType<typeof labDistVis>[],
>(props: P): Promise<R> {
    let data: R;
    try {
        const worker = new LabDistVisWorker();
        const result = await workerService<R, P>(worker, props);
        if (result.success) {
            data = result.data;
        } else {
            throw new Error('[labDistVis worker]' + result.message);
        }
        worker.terminate();
        return data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
