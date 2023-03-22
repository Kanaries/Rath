import type { IFieldMeta, IRow } from "@kanaries/loa";
import { CompareTarget, MetricAggregationType } from "../store";
import { coerceNumber } from "./format";

export type FieldStats = {
    definition: CompareTarget;
    field: IFieldMeta;
    stats: { [key in MetricAggregationType]: number };
};

export const statDivision = (total: readonly IRow[], data: readonly IRow[], fields: readonly IFieldMeta[], fid: string): { [key in MetricAggregationType]: number } => {
    const field = fields.find(f => f.fid === fid);
    if (!field) {
        return {
            [MetricAggregationType.Average]: NaN,
            [MetricAggregationType.Sum]: NaN,
            [MetricAggregationType.Count]: NaN,
            [MetricAggregationType.WeightedAverage]: NaN,
            [MetricAggregationType.NumericalRate]: NaN,
            [MetricAggregationType.C_Rate]: NaN,
            [MetricAggregationType.C_Count]: NaN,
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
            [MetricAggregationType.Average]: sum / data.length,
            [MetricAggregationType.Sum]: sum,
            [MetricAggregationType.Count]: data.length,
            [MetricAggregationType.WeightedAverage]: NaN,   // TODO:
            [MetricAggregationType.NumericalRate]: sum / sumT,
            [MetricAggregationType.C_Rate]: NaN,
            [MetricAggregationType.C_Count]: NaN,
        };
    }
    return {
        [MetricAggregationType.Average]: NaN,
        [MetricAggregationType.Sum]: NaN,
        [MetricAggregationType.Count]: NaN,
        [MetricAggregationType.WeightedAverage]: NaN,
        [MetricAggregationType.NumericalRate]: NaN,
        [MetricAggregationType.C_Rate]: NaN,
        [MetricAggregationType.C_Count]: data.length,
    };
};
