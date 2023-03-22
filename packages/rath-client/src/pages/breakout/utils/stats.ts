import type { IFieldMeta, IFilter, IRow } from "@kanaries/loa";
import type { Aggregator } from "../../../global";
import { BreakoutMainField } from "../store";
import { coerceNumber } from "./format";

export type FieldStats = {
    definition: BreakoutMainField;
    field: IFieldMeta;
    stats: { [key in Aggregator]: number };
};

export const statDivision = (total: readonly IRow[], data: readonly IRow[], fields: readonly IFieldMeta[], fid: string): { [key in Aggregator]: number } => {
    const field = fields.find(f => f.fid === fid);
    if (!field) {
        return {
            mean: NaN,
            sum: NaN,
            count: NaN,
        };
    }
    const isNumerical = field.semanticType === 'quantitative' || field.semanticType === 'temporal';
    if (isNumerical) {
        let sumT = 0;
        for (const row of total) {
            if (Number.isNaN(sumT)) {
                break;
            }
            sumT += coerceNumber(row[fid]);
        }
        let sum = 0;
        for (const row of data) {
            if (Number.isNaN(sum)) {
                break;
            }
            sum += coerceNumber(row[fid]);
        }
        return {
            mean: sum / data.length,
            sum,
            count: data.length,
            // [MetricAggregationType.WeightedAverage]: NaN,
            // [MetricAggregationType.NumericalRate]: sum / sumT,
            // [MetricAggregationType.C_Rate]: NaN,
            // [MetricAggregationType.C_Count]: NaN,
        };
    }
    return {
        mean: NaN,
        sum: NaN,
        // [MetricAggregationType.Count]: NaN,
        // [MetricAggregationType.WeightedAverage]: NaN,
        // [MetricAggregationType.NumericalRate]: NaN,
        // [MetricAggregationType.C_Rate]: NaN,
        count: data.length,
    };
};

export const statSubgroup = (data: readonly IRow[], fid: string, aggregate: Aggregator): number => {
    switch (aggregate) {
        case 'mean': {
            let sum = 0;
            for (const row of data) {
                const val = coerceNumber(row[fid]);
                if (Number.isNaN(val)) {
                    return NaN;
                }
                sum += val;
            }
            return sum / data.length;
        }
        case 'sum': {
            let sum = 0;
            for (const row of data) {
                const val = coerceNumber(row[fid]);
                if (Number.isNaN(val)) {
                    return NaN;
                }
                sum += val;
            }
            return sum;
        }
        case 'count': {
            return data.length;
        }
        // case MetricAggregationType.WeightedAverage: {
        //     return NaN;
        // }
        // case MetricAggregationType.NumericalRate: {
        //     return NaN;
        // }
        // case MetricAggregationType.C_Rate: {
        //     return NaN;
        // }
        // case MetricAggregationType.C_Count: {
        //     return data.length;
        // }
    }
};

export const impactSubgroupGeneral = (overall: readonly IRow[], selection: readonly IRow[], others: readonly IRow[], fid: string, aggregate: Aggregator): number => {
    switch (aggregate) {
        case 'mean': {
            const averOverall = statSubgroup(overall, fid, 'mean');
            const averOthers = statSubgroup(others, fid, 'mean');
            return averOverall - averOthers;
        }
        case 'sum': {
            return statSubgroup(selection, fid, 'sum');
        }
        case 'count': {
            return statSubgroup(selection, fid, 'count');
        }
        // case MetricAggregationType.WeightedAverage: {
        //     return NaN;
        // }
        // case MetricAggregationType.NumericalRate: {
        //     return NaN;
        // }
        // case MetricAggregationType.C_Rate: {
        //     const rateOverall = statSubgroup(overall, fid, MetricAggregationType.C_Rate);
        //     const rateOthers = statSubgroup(others, fid, MetricAggregationType.C_Rate);
        //     return rateOverall - rateOthers;
        // }
        // case MetricAggregationType.C_Count: {
        //     return statSubgroup(selection, fid, MetricAggregationType.Count);
        // }
    }
};

export const impactSubgroupComparison = (
    targetPopulation: readonly IRow[],
    comparePopulation: readonly IRow[],
    targetGroup: readonly IRow[],
    compareGroup: readonly IRow[],
    fid: string,
    aggregate: Aggregator,
): number => {
    switch (aggregate) {
        case 'mean': {
            const sumSubgroupT2 = statSubgroup(targetGroup, fid, 'sum');
            const sumSubgroupT1 = statSubgroup(compareGroup, fid, 'sum');
            const countOverallT2 = statSubgroup(targetPopulation, fid, 'count');
            const countOverallT1 = statSubgroup(comparePopulation, fid, 'count');
            return sumSubgroupT2 / countOverallT2 - sumSubgroupT1 / countOverallT1;
        }
        case 'sum': {
            const sumT2 = statSubgroup(targetGroup, fid, 'sum');
            const sumT1 = statSubgroup(compareGroup, fid, 'sum');
            return sumT2 - sumT1;
        }
        case 'count': {
            const countT2 = statSubgroup(targetGroup, fid, 'count');
            const countT1 = statSubgroup(compareGroup, fid, 'count');
            return countT2 - countT1;
        }
        // case MetricAggregationType.WeightedAverage: {
        //     return NaN;
        // }
        // case MetricAggregationType.NumericalRate: {
        //     return NaN;
        // }
        // case MetricAggregationType.C_Rate: {
        //     const rateT2 = statSubgroup(targetGroup, fid, MetricAggregationType.C_Rate);
        //     const rateT1 = statSubgroup(compareGroup, fid, MetricAggregationType.C_Rate);
        //     return rateT2 - rateT1;
        // }
        // case MetricAggregationType.C_Count: {
        //     const countT2 = statSubgroup(targetGroup, fid, MetricAggregationType.Count);
        //     const countT1 = statSubgroup(compareGroup, fid, MetricAggregationType.Count);
        //     return countT2 - countT1;
        // }
    }
};

export const applyDividers = (dataSource: readonly IRow[], filters: readonly IFilter[]): [readonly IRow[], readonly IRow[]] => {
    if (typeof filters === 'undefined') return [dataSource, []];
    if (filters.length === 0) return [dataSource, []];
    const ans: IRow[] = [];
    const others: IRow[] = [];
    const effectFilters = filters.filter(f => !f.disable);
    const lookupValueSet: Map<string, Set<any>> = new Map();
    for (let filter of effectFilters) {
        if (filter.type === 'set') {
            lookupValueSet.set(filter.fid, new Set(filter.values))
        }
    }
    for (let i = 0; i < dataSource.length; i++) {
        const row = dataSource[i];
        let keep = effectFilters.every(f => {
            if (f.type === 'range') return f.range[0] <= row[f.fid] && row[f.fid] <= f.range[1];
            if (f.type === 'set') return (
                lookupValueSet.get(f.fid)!.has(row[f.fid])
                || lookupValueSet.get(f.fid)!.has(Number(row[f.fid]))
            )
            return false;
        })
        if (keep) ans.push(row);
        else others.push(row);
    }
    return [ans, others];
};
