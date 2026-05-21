import type { IFieldMeta, IRow } from '../interfaces';
import type { PagLink } from '../pages/causal/config';
import type { IFunctionalDep } from '../pages/causal/config';
import { getGlobalStore } from '../store';
import { summarizeCausalEstimate } from '../utils/causalEffect';

export type CausalEffectEstimateRequest = {
    dataSource: readonly IRow[];
    allFields: readonly IFieldMeta[];
    focusedFields: readonly IFieldMeta[];
    targetFid: string;
    treatmentFids: readonly string[];
    pag: readonly PagLink[];
    functionalDependencies: readonly IFunctionalDep[];
    method?: string;
};

export type CausalEffectEstimateResult = {
    rawEstimate: string;
    rawIdentifiedEstimand: string;
    summary: string;
    value?: number;
    targetFid: string;
    treatmentFids: readonly string[];
    method: string;
};

const DEFAULT_METHOD = 'backdoor.linear_regression';

export async function estimateCausalEffect(
    request: CausalEffectEstimateRequest,
): Promise<CausalEffectEstimateResult> {
    const { causalStore } = getGlobalStore();
    const { causalServer, params } = causalStore.operator;
    const method = request.method ?? DEFAULT_METHOD;
    const focusedFieldIds = request.focusedFields.map((f) => f.fid);

    const explainerParams = {
        ...(params.Explainer ?? {}),
        target: request.targetFid,
        treatment: [...request.treatmentFids],
        estimate_effect_method: method,
    };

    const res = await fetch(`${causalServer}/causal/Explainer`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            dataSource: request.dataSource,
            fields: request.allFields,
            focusedFields: focusedFieldIds,
            bgKnowledgesPag: request.pag,
            funcDeps: request.functionalDependencies,
            params: explainerParams,
        }),
    });

    const text = await res.text();
    let parsed: { success?: boolean; data?: { res?: Record<string, string> }; message?: string };
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new Error(`Non-JSON response (${res.status}). ${text.slice(0, 200)}`);
    }

    if (!parsed.success || !parsed.data?.res) {
        throw new Error(parsed.message ?? 'Causal effect estimation failed');
    }

    const rawEstimate = parsed.data.res.causal_estimate ?? '';
    const rawIdentifiedEstimand = parsed.data.res.identified_estimand ?? '';
    const { summary, value } = summarizeCausalEstimate(rawEstimate);

    return {
        rawEstimate,
        rawIdentifiedEstimand,
        summary,
        value,
        targetFid: request.targetFid,
        treatmentFids: request.treatmentFids,
        method,
    };
}
