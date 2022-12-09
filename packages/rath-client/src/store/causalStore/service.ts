import { getGlobalStore } from "..";
import { notify } from "../../components/error";
import type { IFieldMeta } from "../../interfaces";
import type { IAlgoSchema } from "../../pages/causal/config";
import { shouldFormItemDisplay } from "../../pages/causal/dynamicForm";
import type { IteratorStorage } from "../../utils/iteStorage";


export const connectToSession = async (onClose: (reason: Error) => void): Promise<string | null> => {
    const { causalStore: { operator: { causalServer } } } = getGlobalStore();
    try {
        const res = await fetch(`${causalServer}/v0.1/initSession`, { method: 'GET' });
        const result = await res.json() as (
            | { success: true; data: { sessionId: string; lifeSpan: number } }
            | { success: false; message: string }
        );
        if (result.success) {
            const { sessionId } = result.data;
            let { lifeSpan } = result.data;
            const keepSessionAlive = async (): Promise<boolean> => {
                await new Promise<void>(resolve => setTimeout(resolve, lifeSpan - 10));
                const { causalStore: { operator: { sessionId: sid } } } = getGlobalStore();
                if (sessionId !== sid) {
                    return false;
                }
                try {
                    const _res = await fetch(`${causalServer}/v0.1/s/${sessionId}/ping`, { method: 'GET' });
                    const _result = await _res.json() as (
                        | { success: true; data: { lifeSpan: number } }
                        | { success: false; message: string }
                    );
                    if (_result.success) {
                        lifeSpan = _result.data.lifeSpan;
                        keepSessionAlive();
                        return true;
                    }
                    throw new Error(`Session is out-dated. message: ${_result.message}`);
                } catch (reason) {
                    const error = reason instanceof Error ? reason : new Error(`Session ping failed. message: ${reason}`);
                    onClose(error);
                    return false;
                }
            };
            keepSessionAlive();
            return sessionId;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        notify({
            title: 'Initialize Causal Session Error',
            type: 'error',
            content: `${error}`,
        });
    }
    return null;
};

export const updateDataSource = async (
    data: IteratorStorage, fields: readonly IFieldMeta[], prevTableId: string | null
): Promise<string | null> => {
    const { causalStore: { operator: { sessionId, causalServer } } } = getGlobalStore();
    if (!sessionId) {
        return null;
    }
    try {
        if (prevTableId) {
            fetch(`${causalServer}/v0.1/s/${sessionId}/table/${prevTableId}`, { method: 'DELETE' });
        }
    } catch (error) {
        console.warn('Delete session table error', error);
    }
    try {
        const dataSource = await data.getAll();
        const res = await fetch(`${causalServer}/v0.1/s/${sessionId}/uploadTable`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                format: 'dataSource',
                data: dataSource,
                fields: fields.map(f => ({
                    fid: f.fid,
                    name: f.name,
                })),
            }),
        });
        const result = await res.json() as (
            | { success: true; data: { tableId: string } }
            | { success: false; message: string }
        );
        if (result.success) {
            const { tableId } = result.data;
            return tableId;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        notify({
            title: 'Causal Session Table Update Error',
            type: 'error',
            content: `${error}`,
        });
    }
    return null;
};

export const fetchCausalAlgorithmList = async (fields: readonly IFieldMeta[]): Promise<IAlgoSchema | null> => {
    const { causalStore: { operator: { causalServer, sessionId } } } = getGlobalStore();
    if (!sessionId) {
        return null;
    }
    try {
        const schema: IAlgoSchema = await fetch(`${causalServer}/v0.1/form/discovery`, {
            method: 'POST',
            body: JSON.stringify({
                fieldIds: fields.map((f) => f.fid),
                fieldMetas: fields,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((resp) => resp.json());
        return schema;
    } catch (error) {
        console.error('[CausalAlgorithmList error]:', error);
        return null;
    }
};

interface IDiscoverData {
    /** 
     * @deprecated
     * DAG result
     */
    orig_matrix?: number[][];
    matrix: number[][]; // PAG result
    fields: IFieldMeta[];
}
    
export interface IDiscoverResult {
    modelId: string; // 用于之后的Estimation和Intervention
    data: IDiscoverData;
}

type ITaskStatus = {
    taskType: string; // discovery
    taskOpt: string; // 对应的算子
    status: 'PENDING' | 'RUNNING' | 'FAILED';
    progress: number; // 0 - 100
    result: undefined;
} | {
    taskType: string; // discovery
    taskOpt: string; // 对应的算子
    status: 'DONE';
    progress: 100;
    result: IDiscoverResult; // 未来有可能把其他流程也作为Task，例如Explain中的批量实验
};

const PROGRESS_QUERY_SPAN = 4_000;

export interface ITask<T = unknown> {
    value: Promise<T>;
    onprogress: (cb: (progress: number) => void) => void;
    abort: (reason?: unknown) => void;
}

export interface IDiscoveryTask extends ITask<IDiscoverResult> {}

export const discover = async (): Promise<IDiscoveryTask | null> => {
    const { causalStore: {
        operator: { causalServer, busy, sessionId, tableId, algorithm, causalAlgorithmForm, params: options },
        dataset: { fields },
        model: { functionalDependencies, assertionsAsPag }
    } } = getGlobalStore();
    if (!algorithm) {
        notify({
            title: 'Causal Discovery Error',
            type: 'error',
            content: 'Algorithm is not chosen yet.',
        });
        return null;
    }
    if (busy || !sessionId || !tableId) {
        return null;
    }
    const { fieldMetas: allFields } = getGlobalStore().dataSourceStore;
    const focusedFields = fields.map(f => {
        return allFields.findIndex(which => which.fid === f.fid);
    }).filter(idx => idx !== -1);
    const inputFields = focusedFields.map(idx => allFields[idx]);
    try {
        const params = Object.fromEntries(causalAlgorithmForm[algorithm].items.filter(item => {
            return shouldFormItemDisplay(item, options[algorithm]);
        }).map(item => [item.key, options[algorithm][item.key]]));
        const res = await fetch(`${causalServer}/v0.1/s/${sessionId}/discover`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                algoName: algorithm,
                tableId,
                fields: allFields,
                focusedFields: inputFields.filter(f => f.fid),
                bgKnowledgesPag: assertionsAsPag,
                funcDeps: functionalDependencies,
                params,
            }),
        });
        const result = await res.json() as (
            | { success: true; data: { taskId: string } }
            | { success: false; message: string }
        );
        if (result.success) {
            const { taskId } = result.data;
            let reject = (() => {}) as (reason?: unknown) => void;
            let handleProgress: ((progress: number) => void) | null = null;
            const taskAsPromise = new Promise<IDiscoverResult>((_resolve, _reject) => {
                let timer: NodeJS.Timeout | null = null;
                reject = (reason) => {
                    if (timer !== null) {
                        clearTimeout(timer);
                    }
                    fetch(`${causalServer}/v0.1/s/${sessionId}/task/${taskId}`, { method: 'DELETE' });
                    _reject(reason);
                };
                const query = async () => {
                    timer = null;
                    try {
                        const r = await fetch(`${causalServer}/v0.1/s/${sessionId}/task/${taskId}`, { method: 'GET' });
                        const d = await r.json() as (
                            | { success: true; data: ITaskStatus }
                            | { success: false; message: string }
                        );
                        if (d.success) {
                            const { data } = d;
                            if (data.status === 'DONE') {
                                return _resolve(data.result);
                            }
                            handleProgress?.(data.progress);
                            timer = setTimeout(query, PROGRESS_QUERY_SPAN);
                        } else {
                            throw new Error(`[Discover Task] Request failed: ${d.message}`);
                        }
                    } catch (error) {
                        _reject(error);
                    }
                };
                timer = setTimeout(query, PROGRESS_QUERY_SPAN);
            });
            const handler: IDiscoveryTask = {
                value: taskAsPromise,
                onprogress: cb => handleProgress = cb,
                abort: reject,
            };
            return handler;
        }
        throw new Error(`Request Failed: ${result.message}`);
    } catch (error) {
        notify({
            title: 'Causal Discover Error',
            type: 'error',
            content: `${error}`,
        });
    }
    return null;
};
