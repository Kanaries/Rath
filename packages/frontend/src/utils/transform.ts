import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { IRow } from "visual-insights"
import { IAnalyticType } from "visual-insights/build/esm/insights/InsightFlow/interfaces"
import { inferAnalyticTypeFromSemanticType } from "."
import { Field } from "../global"
import { IFieldMeta } from "../interfaces"
import { FieldSummary } from "../service"

dayjs.extend(customParseFormat);

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
// todo: Sync time rules in visual-insights
// const TIME_RULES: RegExp[] = [
//     /^[0-9]{2,4}[-/][0-9]{1,2}([-/][0-9]{1,2})?$/, // YYYY-MM-DD
//     /^[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4}$/, // MM-DD-YYYY
//     /^[0-9]{4}[0-9]{2}[0-9]{2}$/, // YYYYMMDD
//     /^[0-9]{2,4}[-/][0-9]{1,2}[-/][0-9]{1,2} [0-9]{1,2}:[0-9]{1-2}:[0-9]{1-2}$/ // YYYY-MM-DD HH:mm:ss
// ]
const NON_SRD_TIME_REULES = {
    'DD-MM-YYYY': /^[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4}$/,
    'YYYYMMDD': /^[0-9]{4}[0-9]{2}[0-9]{2}$/
} as const
function stdTimeFormatter(value: string): string | null {
    if (NON_SRD_TIME_REULES['DD-MM-YYYY'].test(value)) {
        const d = dayjs(value, 'DD-MM-YYYY');
        return d.isValid() ? d.format('YYYY-MM-DD') : null;
    }
    if (NON_SRD_TIME_REULES['YYYYMMDD'].test(value)) {
        const d = dayjs(value, 'DD-MM-YYYY');
        return d.isValid() ? d.format('YYYYMMDD') : null;
    }
    return value;
}
/**
 * This function will mute dataSource itself. The return of the function is the same ref of params dataSource.
 * @param dataSource 
 * @param timeFields 
 */
export function formatTimeField (dataSource: IRow[], timeFields: string[]): IRow[] {
    for (let i = 0; i < dataSource.length; i++) {
        const row = dataSource[i];
        for (let j = 0; j < timeFields.length; j++) {
            if (typeof row[timeFields[j]] === 'string') {
                row[timeFields[j]] = stdTimeFormatter(row[timeFields[j]]);
            }
        }
    }
    return dataSource;
}