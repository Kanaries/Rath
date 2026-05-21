import { PAG_NODE, type PagLink } from '../pages/causal/config';
import type { IFieldMeta } from '../interfaces';
import type { AutopilotHandoff } from '../store/workflowStore';

export type EffectEstimationPlan = {
    targetFid: string;
    treatmentFids: string[];
};

export function pickEffectEstimationPlan(
    pag: readonly PagLink[],
    fields: readonly IFieldMeta[],
    autopilotHandoff: AutopilotHandoff | null,
): EffectEstimationPlan | null {
    if (fields.length === 0 || pag.length === 0) {
        return null;
    }

    const fieldSet = new Set(fields.map((f) => f.fid));
    const preferredTarget =
        autopilotHandoff?.measures.find((fid) => fieldSet.has(fid))
        ?? fields.find((f) => f.analyticType === 'measure')?.fid
        ?? fields.find((f) => f.semanticType === 'quantitative')?.fid
        ?? fields[0]?.fid;

    if (!preferredTarget) {
        return null;
    }

    const treatments = new Set<string>();
    for (const link of pag) {
        if (link.tar === preferredTarget && link.src_type !== PAG_NODE.ARROW && fieldSet.has(link.src)) {
            treatments.add(link.src);
        }
        if (link.src === preferredTarget && link.tar_type !== PAG_NODE.ARROW && fieldSet.has(link.tar)) {
            treatments.add(link.tar);
        }
    }

    if (treatments.size === 0 && autopilotHandoff) {
        for (const fid of autopilotHandoff.dimensions) {
            if (fieldSet.has(fid) && fid !== preferredTarget) {
                treatments.add(fid);
            }
        }
    }

    if (treatments.size === 0) {
        for (const link of pag) {
            if (link.src_type !== PAG_NODE.ARROW && fieldSet.has(link.src) && link.src !== preferredTarget) {
                treatments.add(link.src);
            }
        }
    }

    const treatmentFids = [...treatments].slice(0, 5);
    if (treatmentFids.length === 0) {
        return null;
    }

    return { targetFid: preferredTarget, treatmentFids };
}

export function summarizeCausalEstimate(raw: string): { summary: string; value?: number } {
    const trimmed = raw.trim();
    if (!trimmed) {
        return { summary: '' };
    }

    const valueMatch = trimmed.match(/(?:value=|value:\s*|estimate=)([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/i)
        ?? trimmed.match(/([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/);
    const value = valueMatch ? Number(valueMatch[1]) : undefined;

    if (typeof value === 'number' && Number.isFinite(value)) {
        return {
            value,
            summary: trimmed.length > 240 ? `${trimmed.slice(0, 240)}…` : trimmed,
        };
    }

    return {
        summary: trimmed.length > 400 ? `${trimmed.slice(0, 400)}…` : trimmed,
    };
}
