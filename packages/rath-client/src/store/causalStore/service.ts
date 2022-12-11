import { getGlobalStore } from "..";
import { notify } from "../../components/error";
import type { IFieldMeta, IRawField, IRow } from "../../interfaces";
import { IAlgoSchema, PagLink, PAG_NODE } from "../../pages/causal/config";
import { shouldFormItemDisplay } from "../../pages/causal/dynamicForm";
import type { IteratorStorage } from "../../utils/iteStorage";
import type CausalModelStore from "./modelStore";


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
                await new Promise<void>(resolve => setTimeout(resolve, lifeSpan * 1_000 * 0.8));
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
        console.warn('Initialize Causal Session Error', error);
    }
    return null;
};

export const updateDataSource = async (
    data: IteratorStorage | readonly IRow[], fields: readonly IRawField[], prevTableId: string | null
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
        const dataSource = Array.isArray(data) ? data as readonly IRow[] : await (data as IteratorStorage).getAll();
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
                    semanticType: f.semanticType,
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

export const fetchCausalAlgorithmList = async (): Promise<IAlgoSchema | null> => {
    const { causalStore: { operator: { causalServer, sessionId } } } = getGlobalStore();
    if (!sessionId) {
        return null;
    }
    try {
        const res = await fetch(`${causalServer}/v0.1/form/discovery`, { method: 'GET' });
        if (!res.ok) {
            throw new Error(res.statusText);
        }

        const result = await res.json() as (
            | { success: true; data: IAlgoSchema }
            | { success: false; message: string }
        );

        if (result.success === false) {
            notify({
                type: 'error',
                title: 'Failed to get causal discovery param schema',
                content: result.message,
            });
            return null;
        }
        const schema = result.data;
        return schema;
    } catch (error) {
        notify({
            title: 'CausalAlgorithmList Error',
            type: 'error',
            content: `${error}`,
        });
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
    fields: IRawField[];
}
    
export interface IDiscoverResult {
    modelId: string; // 用于之后的Estimation和Intervention
    data: IDiscoverData;
}

type ITaskStatus = {
    taskType: string; // discovery
    taskOpt: string; // 对应的算子
    status: 'PENDING' | 'RUNNING';
    progress: number; // 0 - 100
    result: undefined;
    message: undefined;
} | {
    taskType: string; // discovery
    taskOpt: string; // 对应的算子
    status: 'DONE';
    progress: 100;
    result: IDiscoverResult; // 未来有可能把其他流程也作为Task，例如Explain中的批量实验
    message: undefined;
} | {
    taskType: string; // discovery
    taskOpt: string; // 对应的算子
    status: 'FAILED';
    progress: 100;
    result: undefined; // 未来有可能把其他流程也作为Task，例如Explain中的批量实验
    message: string;
};

const PROGRESS_QUERY_SPAN = 1_000;

export interface ITask<T = unknown> {
    value: Promise<T>;
    onprogress: (cb: (progress: number) => void) => void;
    abort: (reason?: unknown) => void;
    retry: () => ITask<T>;
}

export interface ITaskRecord<T = unknown> {
    readonly taskId: string;
    readonly task: ITask<T>;
    readonly onResolve?: (result: T) => void;
    readonly onFinally?: () => void;
    status: ITaskStatus['status'];
    progress: number;
}

export interface IDiscoveryTask extends ITask<IDiscoverResult> {}

const runDiscovery = async (
    { fields, tableId }: {
        fields: readonly IRawField[],
        tableId: string | null,
    } = {
        fields: getGlobalStore().causalStore.dataset.fields,
        tableId: getGlobalStore().causalStore.operator.tableId,
    },
    model: Pick<CausalModelStore, 'assertionsAsPag' | 'functionalDependencies'> = getGlobalStore().causalStore.model,
): Promise<[string, IDiscoveryTask] | null> => {
    const {
        operator: { causalServer, sessionId, causalAlgorithmForm, params, algorithm },
    } = getGlobalStore().causalStore;
    if (sessionId === null || tableId === null || algorithm === null) {
        return null;
    }
    const { assertionsAsPag, functionalDependencies } = model;
    try {
        const realParams = Object.fromEntries(causalAlgorithmForm[algorithm].items.filter(item => {
            return shouldFormItemDisplay(item, params[algorithm]);
        }).map(item => [item.key, params[algorithm][item.key]]));
        const res = await fetch(`${causalServer}/v0.1/s/${sessionId}/discover`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                algoName: algorithm,
                tableId,
                fields: fields,
                focusedFields: fields.map(f => f.fid),
                bgKnowledgesPag: assertionsAsPag,
                funcDeps: functionalDependencies,
                params: realParams,
            }),
        });
        const result = await res.json() as (
            | { success: true; data: { taskId: string } }
            | { success: false; message: string }
        );
        if (result.success) {
            const { taskId } = result.data;
            const make = (): IDiscoveryTask => {
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
                            // TODO: 阈值
                            const r = await fetch(`${causalServer}/v0.1/s/${sessionId}/task/${taskId}?confidence_threshold=${(window as any).ct ?? 0.0001}`, { method: 'GET' });
                            const d = await r.json() as (
                                | { success: true; data: ITaskStatus }
                                | { success: false; message: string }
                            );
                            if (d.success) {
                                const { data } = d;
                                if (data.status === 'DONE') {
                                    return _resolve(data.result);
                                } else if (data.status === 'FAILED') {
                                    return _reject(data.message || 'task failed');
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
                return {
                    value: taskAsPromise,
                    onprogress: cb => handleProgress = cb,
                    abort: reject,
                    retry: make,
                };
            };
            const handler = make();
            return [taskId, handler];
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

export const discover = (): Promise<[string, IDiscoveryTask] | null> => {
    const {
        dataset: { fields: allFields, groups },
        operator: { tableId },
        model: { assertionsAsPag, functionalDependencies },
    } = getGlobalStore().causalStore;
    const fields: IFieldMeta[] = allFields.filter((f) => {
        return !groups.some(group => group.root === f.fid);
    });
    const groupAssr = groups.reduce<typeof assertionsAsPag[number][]>((list, group) => {
        for (const src of group.children) {
            for (const tar of group.children.filter(node => node !== src)) {
                list.push({
                    src,
                    src_type: PAG_NODE.EMPTY,
                    tar,
                    tar_type: PAG_NODE.EMPTY,
                });
            }
        }
        return list;
    }, []).filter(assr => {
        return fields.some(f => f.fid === assr.src) && fields.some(f => f.fid === assr.tar);
    });
    return runDiscovery(
        { fields, tableId },
        { assertionsAsPag: assertionsAsPag.filter(assr => {
            return fields.some(f => f.fid === assr.src) && fields.some(f => f.fid === assr.tar);
        }).concat(groupAssr), functionalDependencies }
    );
};

export const forceUpdateModel = async (
    data: readonly IRow[], fields: readonly IRawField[], model: readonly PagLink[]
): Promise<string | null> => {
    const tableId = await updateDataSource(data, fields, null);
    if (!tableId) {
        return null;
    }
    const task = await runDiscovery(
        { fields, tableId },
        { assertionsAsPag: model, functionalDependencies: getGlobalStore().causalStore.model.functionalDependencies }
    );
    if (!task) {
        notify({
            title: 'Failed to force update causal model',
            type: 'error',
            content: 'task is null',
        });
        return null;
    }
    return task[0];
};
