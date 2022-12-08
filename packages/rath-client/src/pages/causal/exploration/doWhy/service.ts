import { notify } from "../../../../components/error";
import type { IFieldMeta, IRow, IFilter } from "../../../../interfaces";
import { getGlobalStore } from "../../../../store";
import type { IForm, IFunctionalDep, PagLink } from "../../config";


export interface IDoWhyServiceRequest {
    data: readonly IRow[];
    /** 数据中所有字段 */
    fields: readonly IFieldMeta[];
    causalModel: {
        /** 函数依赖 */
        funcDeps: readonly IFunctionalDep[];
        /** 用户编辑后的因果图 */
        edges: readonly PagLink[];
    };
    groups: {
        current: { predicates: readonly IFilter[] };
        population: { predicates: readonly IFilter[] };
    };
    /** 同时影响 dimensions 和 measure 的 fid */
    confounders: readonly string[];
    /** 只作用于 measure 的 fid */
    effectModifiers: readonly string[];
    /** 分析目标 fid */
    outcome: string;
    
    params: { [key: string]: any };
}

export interface IDoWhyServiceResult {
    /** 贡献度 */
    weight: number;
}

export const fetchDoWhyParamSchema = async (): Promise<IForm | null> => {
    const { causalStore: { operator: { causalServer } } } = getGlobalStore();

    const res = await fetch(`${causalServer}/estimate/form`, { method: 'GET' });

    if (!res.ok) {
        notify({
            type: 'error',
            title: 'Do Why Error',
            content: res.statusText,
        });
        return null;
    }

    const result = await res.json() as (
        | { success: true; data: IForm }
        | { success: false; message: string }
    );

    if (result.success === false) {
        notify({
            type: 'error',
            title: 'Failed to get Do Why param schema',
            content: result.message,
        });
        return null;
    }

    return result.data;
};

export const doWhy = async (
    props: Pick<IDoWhyServiceRequest, 'confounders' | 'effectModifiers' | 'outcome'> & {
        populationPicker: readonly IFilter[];
        predicates: readonly IFilter[];
    },
    params: IDoWhyServiceRequest['params'],
): Promise<IDoWhyServiceResult | null> => {
    const { causalStore, dataSourceStore } = getGlobalStore();
    const { cleanedData, fieldMetas } = dataSourceStore;
    const { causalServer } = causalStore.operator;
    const { functionalDependencies, mergedPag } = causalStore.model;

    const payload: IDoWhyServiceRequest = {
        data: cleanedData,
        fields: fieldMetas,
        causalModel: {
            funcDeps: functionalDependencies,
            edges: mergedPag,
        },
        groups: {
            current: { predicates: props.populationPicker.concat(props.predicates) },
            population: { predicates: props.populationPicker },
        },
        confounders: props.confounders,
        effectModifiers: props.effectModifiers,
        outcome: props.outcome,
        params,
    };

    const res = await fetch(`${causalServer}/estimate/calc`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        notify({
            type: 'error',
            title: 'Do Why Error',
            content: res.statusText,
        });
        return null;
    }

    const result = await res.json() as (
        | { success: true; data: IDoWhyServiceResult }
        | { success: false; message: string }
    );

    if (result.success === false) {
        notify({
            type: 'error',
            title: 'Do Why Error',
            content: result.message,
        });
        return null;
    }

    return result.data;
};
