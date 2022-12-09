import { getGlobalStore } from "..";
import { notify } from "../../components/error";
import type { IFieldMeta } from "../../interfaces";
import type { IAlgoSchema, PagLink, PAG_NODE } from "../../pages/causal/config";
import { shouldFormItemDisplay } from "../../pages/causal/dynamicForm";
import type { IteratorStorage } from "../../utils/iteStorage";
import { findUnmatchedCausalResults, resolveCausality } from "./pag";


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

export const discover = async (): Promise<{ raw: number[][]; pag: PagLink[] } | null> => {
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
    let causality: { raw: number[][]; pag: PagLink[] } | null = null;
    const { fieldMetas: allFields } = getGlobalStore().dataSourceStore;
    const focusedFields = fields.map(f => {
        return allFields.findIndex(which => which.fid === f.fid);
    }).filter(idx => idx !== -1);
    const inputFields = focusedFields.map(idx => allFields[idx]);
    try {
        const originFieldsLength = inputFields.length;
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
        const result = await res.json();
        if (result.success) {
            const rawMatrix = result.data.matrix as PAG_NODE[][];
            const causalMatrix = rawMatrix
                .slice(0, originFieldsLength)
                .map((row) => row.slice(0, originFieldsLength));
            const causalPag = resolveCausality(causalMatrix, inputFields);
            causality = { raw: causalMatrix, pag: causalPag };
            const unmatched = findUnmatchedCausalResults(assertionsAsPag, causalPag);
            if (unmatched.length > 0 && process.env.NODE_ENV !== 'production') {
                const getFieldName = (fid: string) => {
                    const field = inputFields.find(f => f.fid === fid);
                    return field?.name ?? fid;
                };
                for (const info of unmatched) {
                    notify({
                        title: 'Causal Result Not Matching',
                        type: 'error',
                        content: `Conflict in edge "${getFieldName(info.srcFid)} -> ${getFieldName(info.tarFid)}":\n`
                            + `  Expected: ${info.expected.src_type} -> ${info.expected.tar_type}\n`
                            + `  Received: ${info.received.src_type} -> ${info.received.tar_type}`,
                    });
                }
            }
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        notify({
            title: 'Causal Discover Error',
            type: 'error',
            content: `${error}`,
        });
    }
    return causality;
};
