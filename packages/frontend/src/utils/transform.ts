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