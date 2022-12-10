import { notify } from "../../../../components/error";
import { getGlobalStore } from "../../../../store";
import type { IAlgoSchema } from "../../config";


export interface IWhatIfServiceRequest {
    algoName: string; // 预测算法
    modelId: string;
    do: {
        [fid: string]: number; // [-2, 2], 调整的方向和范围
    };
    params: { [key: string]: any };
}

export interface IWhatIfServiceResult {
    base: { [fid: string]: number };
}

export const fetchWhatIfParamSchema = async (): Promise<IAlgoSchema | null> => {
    const { causalStore: { operator: { causalServer, serverActive } } } = getGlobalStore();

    if (!serverActive) {
        return null;
    }

    const res = await fetch(`${causalServer}/v0.1/form/intervention`, { method: 'GET' });

    if (!res.ok) {
        notify({
            type: 'error',
            title: 'WhatIf Error',
            content: res.statusText,
        });
        return null;
    }

    const result = await res.json() as (
        | { success: true; data: IAlgoSchema }
        | { success: false; message: string }
    );

    if (result.success === false) {
        notify({
            type: 'error',
            title: 'Failed to get WhatIf param schema',
            content: result.message,
        });
        return null;
    }

    return result.data;
};

export const predicateWhatIf = async (
    conditions: { [fid: string]: number },
    algoName: string,
    params: IWhatIfServiceRequest['params'],
): Promise<IWhatIfServiceResult | null> => {
    if (Object.keys(conditions).length === 0) {
        return null;
    }

    const { causalStore } = getGlobalStore();
    const { causalServer, sessionId } = causalStore.operator;
    const { modelId } = causalStore.model;

    if (!sessionId || !modelId) {
        return null;
    }

    const payload: IWhatIfServiceRequest = {
        algoName,
        modelId,
        do: conditions,
        params,
    };

    const res = await fetch(`${causalServer}/v0.1/${sessionId}/intervene`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        notify({
            type: 'error',
            title: 'WhatIf Error',
            content: res.statusText,
        });
        return null;
    }

    const result = await res.json() as (
        | { success: true; data: IWhatIfServiceResult }
        | { success: false; message: string }
    );

    if (result.success === false) {
        notify({
            type: 'error',
            title: 'WhatIf Error',
            content: result.message,
        });
        return null;
    }

    return result.data;
};
