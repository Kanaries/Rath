import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { Specification } from "@kanaries/graphic-walker/dist/interfaces";
import { IRow } from "visual-insights"
import { IVegaSubset } from "../interfaces"

dayjs.extend(customParseFormat);

export function transNumber(num: any): number | null {
    if (isNaN(num)) {
        return null
    }
    return Number(num)
}

// todo: [refactor] Sync time rules in visual-insights
// Hao Chen, 10 months ago   (January 25th, 2022 10:22 PM) 
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

/**
 * 这是一个临时方案，因为我并不确定，自动化之后是直接使用vega spec还是自建spec，等确定之后，这里也需要改动。
 */
export function transVegaSubset2Schema (vegaSpec: IVegaSubset): Specification {
    const schema: Specification = {}
    if (typeof vegaSpec.mark === 'string') {
        schema.geomType = [vegaSpec.mark]
    } else {
        schema.geomType = [vegaSpec.mark.type]
    }
    schema.position = []
    if (vegaSpec.encoding.x) {
        vegaSpec.encoding.x.field && schema.position.push(vegaSpec.encoding.x.field)
    }
    if (vegaSpec.encoding.y) {
        vegaSpec.encoding.y.field && schema.position.push(vegaSpec.encoding.y.field)
    }
    schema.facets = []
    if (vegaSpec.encoding.row) {
        vegaSpec.encoding.row.field && schema.facets.push(vegaSpec.encoding.row.field)
    }
    if (vegaSpec.encoding.column) {
        vegaSpec.encoding.column.field && schema.facets.push(vegaSpec.encoding.column.field)
    }

    (['color', 'opacity', 'shape', 'size'] as const).forEach(channel => {
        if (vegaSpec.encoding[channel] && vegaSpec.encoding[channel]!.field) {
            schema[channel] = [vegaSpec.encoding[channel]!.field]
        }
    })
    const hasAgg = Boolean(Object.values(vegaSpec.encoding).find(encoding => {
        if (encoding && encoding.aggregate) {
            return true
        }
        return false
    }))
    schema.aggregate = hasAgg;
    return schema
}