/* eslint no-restricted-globals: 0 */
import type { IRow, IFilter, IFieldMeta } from "../../interfaces";
import type { IFunctionalDep, PagLink } from "../../pages/causal/config";
import { insightExplain } from "./utils";


export interface IRInsightExplainSubspace {
    predicates: IFilter[];
    /** @default false 值为 true 时取反 */
    reverted?: boolean;
}

export interface IRInsightExplainProps {
    /** 因果图输入数据子集 */
    data: readonly IRow[];
    fields: readonly IFieldMeta[];
    causalModel: {
        /** 函数依赖 */
        funcDeps: readonly IFunctionalDep[];
        /** 用户编辑后的因果图 */
        edges: readonly PagLink[];
    };
    groups: {
        current: IRInsightExplainSubspace;
        other: IRInsightExplainSubspace;
    };
    view: {
        /** 视图上所有 channel 的 fid */
        dimensions: string[];
        /** 分析目标，视图的纵轴：关注的 fields */
        measures: {
            fid: string;
            op: 'sum' | 'mean' | 'count' | null;
        }[];
    };
}

export interface IRInsightExplainResult {
    causalEffects: Array<PagLink & {
        /** 展示的文本 */
        description?: {
            /** title I18n text key */
            title: string;
            /** description I18n text key */
            key: string;
            /** description I18n text data */
            data?: { [textKey: string]: string | number };
        };
        responsibility: number; // [-1, 1]
    }>;
}

const RInsightService = (e: MessageEvent<IRInsightExplainProps>) => {
    try {
        self.postMessage({
            success: true,
            data: insightExplain(e.data),
        });
    } catch (error) {
        self.postMessage({
            success: false,
            message: `[RInsight] ${error}`,
        });
    }
}


self.addEventListener('message', RInsightService, false);
