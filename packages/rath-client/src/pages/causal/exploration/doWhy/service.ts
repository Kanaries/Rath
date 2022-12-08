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

    // TODO: remove this mock
    return {
        title: 'params (mock)',
        description: 'description (mock)',
        items: [
            {
                "title": "改变我有不同的其他参数",
                "key": "test",
                "dataType": "string",
                "renderType": "dropdown",
                "description": "The encoding to use for categorical variables",
                "defaultValue": "A",
                "options": [
                    {
                        "text": "A",
                        "key": "A"
                    },
                    {
                        "text": "B",
                        "key": "B"
                    },
                    {
                        "text": "C",
                        "key": "C"
                    },
                    {
                        "text": "D",
                        "key": "D"
                    },
                ]
            },
            {
                "title": "[A] 数值型变量编码方式",
                "key": "quantEncodeType",
                "dataType": "string",
                "renderType": "dropdown",
                "description": "The encoding to use for quantitative variables",
                "defaultValue": "bin",
                "options": [
                    {
                        "text": "分箱",
                        "key": "bin"
                    },
                    {
                        "text": "无",
                        "key": "none"
                    },
                    {
                        "text": "排名",
                        "key": "order"
                    }
                ],
                conditions: {
                    or: [{
                        and: [{
                            key: 'test',
                            oneOf: ['A']
                        }],
                    }]
                },
            },
            {
                "title": "[B] 独立性检验",
                "key": "independence_test_method",
                "dataType": "string",
                "renderType": "dropdown",
                "description": "Independence test method function.  Default: ‘fisherz’",
                "defaultValue": "gsq",
                "options": [
                    {
                        "text": "G检验",
                        "key": "gsq"
                    },
                    {
                        "text": "卡方条件独立性检验",
                        "key": "chisq"
                    },
                    {
                        "text": "Fisher-Z变换",
                        "key": "fisherz"
                    },
                    {
                        "text": "允许空值的Fisher-Z变换",
                        "key": "mv_fisherz"
                    }
                ],
                conditions: {
                    or: [{
                        and: [{
                            key: 'test',
                            oneOf: ['B']
                        }],
                    }]
                },
            },
            {
                "title": "[C] 显著性阈值",
                "key": "alpha",
                "dataType": "number",
                "renderType": "slider",
                "description": "Significance level of individual partial correlation tests. Default: 0.05.",
                "defaultValue": 0.05,
                "range": [
                    0.0001,
                    1
                ],
                "step": 0.0001,
                conditions: {
                    or: [{
                        and: [{
                            key: 'test',
                            oneOf: ['C']
                        }],
                    }]
                },
            },
            {
                "title": "[ACD] 邻接表搜索深度",
                "key": "depth",
                "dataType": "number",
                "renderType": "slider",
                "description": "The depth for the fast adjacency search, or -1 if unlimited. Default: -1.",
                "defaultValue": -1,
                "range": [
                    -1,
                    8
                ],
                "step": 1,
                conditions: {
                    or: [{
                        and: [{
                            key: 'test',
                            oneOf: ['A', 'C', 'D']
                        }],
                    }]
                },
            },
            {
                "title": "[fisher-z] 判别路径最大长度",
                "key": "max_path_length",
                "dataType": "number",
                "renderType": "slider",
                "description": "The maximum length of any discriminating path, or -1 if unlimited. Default: -1",
                "defaultValue": -1,
                "range": [
                    -1,
                    16
                ],
                "step": 1,
                conditions: {
                    or: [{
                        and: [{
                            key: 'independence_test_method',
                            oneOf: ['fisherz']
                        }],
                    }]
                },
            }
        ],
    };

    // const res = await fetch(`${causalServer}/estimate/form`, { method: 'GET' });

    // if (!res.ok) {
    //     return null;
    // }

    // const result = await res.json() as (
    //     | { success: true; data: IForm }
    //     | { success: false; message: string }
    // );

    // if (result.success === false) {
    //     notify({
    //         type: 'error',
    //         title: 'Failed to get Do Why param schema',
    //         content: result.message,
    //     });
    //     return null;
    // }

    // return result.data;
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
