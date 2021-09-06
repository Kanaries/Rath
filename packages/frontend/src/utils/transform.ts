import { IAnalyticType } from "visual-insights/build/esm/insights/InsightFlow/interfaces"
import { inferAnalyticTypeFromSemanticType } from "."
import { Field } from "../global"
import { IFieldMeta } from "../interfaces"
import { FieldSummary } from "../service"

export function transNumber(num: any): number | null {
    if (isNaN(num)) {
        return null
    }
    return Number(num)
}

export function fieldMeta2fieldSummary(metas: IFieldMeta[]): FieldSummary[] {
    return metas.map(f => ({
        fieldName: f.fid,
        entropy: f.features.entropy,
        maxEntropy: f.features.maxEntropy,
        type: f.semanticType,
        distribution: f.distribution
    }))
}

export function fieldSummary2fieldMeta(summary: FieldSummary[], analyticTypes?: IAnalyticType[]): IFieldMeta[] {
    if (typeof analyticTypes === 'undefined') {
        console.warn('You are using analytic types infered from semantic type, it may not be safe.')
    }
    return summary.map((s, i) => ({
        fid: s.fieldName,
        features: {
            maxEntropy: s.maxEntropy,
            entropy: s.entropy
        },
        semanticType: s.type,
        analyticType: analyticTypes ? analyticTypes[i] : inferAnalyticTypeFromSemanticType(s.type),
        distribution: s.distribution,
        disable: false
    }))
}

/**
 * @deprecated
 */
export function meta2fieldScores(metas: IFieldMeta[]): [string, number, number, Field][] {
    return metas.map(m => [m.fid, m.features.entropy, m.features.maxEntropy, {
        name: m.fid,
        type: m.semanticType
    }])
}