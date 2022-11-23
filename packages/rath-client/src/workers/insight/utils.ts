import { applyFilters } from "@kanaries/loa";
import dayjs from "dayjs";
import type { IFieldMeta, IRow } from "../../interfaces";
import { getRange } from "../../utils";
import type { IRInsightExplainProps, IRInsightExplainResult } from "./r-insight.worker";


const MAX_BIN = 16;

type AggregateType = 'count' | 'sum' | 'mean';

const xHash = (data: IRow[], field: IFieldMeta): number[] => {
    switch (field.semanticType) {
        case 'quantitative': {
            const col = data.map(row => Number(row[field.fid]));
            const [min, max] = getRange(col.filter(Number.isFinite));
            return col.map(d => Math.floor(Math.min((d - min) * MAX_BIN / (max - min), MAX_BIN - 1)));
        }
        case 'temporal': {
            const col = data.map(row => dayjs(row[field.fid]).toDate().getTime());
            const [min, max] = getRange(col.filter(Number.isFinite));
            return col.map(d => Math.floor(Math.min((d - min) * MAX_BIN / (max - min), MAX_BIN - 1)));
        }
        default: {
            const col = data.map(row => row[field.fid]);
            const count = new Map<string | number, number>();
            for (const d of col) {
                count.set(d, (count.get(d) ?? 0) + 1);
            }
            const projection: [string | number, number][] = [];
            for (const [key, freq] of count.entries()) {
                projection.push([key, freq]);
            }
            projection.sort((a, b) => b[1] - a[1]);
            const map = new Map<string | number, number>();
            for (let i = 0; i < projection.length && i < MAX_BIN - 1; i += 1) {
                map.set(projection[i][0], i);
            }
            const projector = (val: string | number) => map.get(val) ?? (MAX_BIN - 1);
            return col.map(projector);
        }
    }
};

const indexKey = '__index__';
const hashIndexKey = '__hash_index__';

const xNormalizeAggregated = (data: IRow[], field: IFieldMeta, aggregate: AggregateType): number[] => {
    const res = new Array<0>(MAX_BIN).fill(0);
    const col: number[] = [];
    if (aggregate !== 'count') {
        for (const row of data) {
            const val = row[field.fid];
            switch (field.semanticType) {
                case 'quantitative': {
                    col.push(Number(val));
                    break;
                }
                case 'temporal': {
                    col.push(dayjs(row[field.fid]).toDate().getTime());
                    break;
                }
                default: {
                    col.push(val);
                    break;
                }
            }
        }
    }
    switch (aggregate) {
        case 'count': {
            for (const row of data) {
                res[row[hashIndexKey]] += 1;
            }
            for (let i = 0; i < res.length; i += 1) {
                res[i] /= data.length;
            }
            break;
        }
        case 'sum': {
            let total = 0;
            for (let i = 0; i < col.length; i += 1) {
                const row = data[i];
                const idx = row[hashIndexKey];
                const w = col[i];
                res[idx] += w;
                total += w;
            }
            for (let i = 0; i < res.length; i += 1) {
                res[i] /= total;
            }
            break;
        }
        case 'mean': {
            const count = res.map(() => 0);
            for (let i = 0; i < col.length; i += 1) {
                const row = data[i];
                const idx = row[hashIndexKey];
                const w = col[i];
                res[idx] += w;
            }
            let total = 0;
            for (let i = 0; i < res.length; i += 1) {
                if (count[i] !== 0) {
                    res[i] /= count[i];
                    total += res[i];
                }
            }
            for (let i = 0; i < res.length; i += 1) {
                if (res[i] !== 0) {
                    res[i] /= total;
                }
            }
            break;
        }
        default: {
            break;
        }
    }
    return res;
};

const diffGroups = (
    data: IRow[],
    indices1: number[],
    indices2: number[],
    dimension: IFieldMeta,
    measure: { fid: string; aggregate: AggregateType },
): number => {
    const hashIndices = xHash(data, dimension);
    const hashedData = data.map((row, i) => ({
        ...row,
        [hashIndexKey]: hashIndices[i],
    }));
    const data1 = indices1.map(index => hashedData[index]);
    const data2 = indices2.map(index => hashedData[index]);
    const group1 = xNormalizeAggregated(data1, dimension, measure.aggregate);
    const group2 = xNormalizeAggregated(data2, dimension, measure.aggregate);
    const diff = new Array<0>(MAX_BIN).fill(0).reduce<{ loss: number; count: number }>((ctx, _, i) => {
        const a = group1[i];
        const b = group2[i];
        if (a === 0 && b === 0) {
            return ctx;
        }
        const loss = Math.abs(a - b); // TODO: 减小较小误差的影响 - 置信区间？
        return {
            loss: ctx.loss + loss,
            count: ctx.count + 1,
        };
    }, { loss: 0, count: 0 });
    return diff.count === 0 ? 1 : diff.loss / diff.count;
};

export const insightExplain = (props: IRInsightExplainProps): IRInsightExplainResult => {
    const { data, fields, causalModel: { edges }, groups, view } = props;

    const res: IRInsightExplainResult = {
        causalEffects: [],
    };

    const indexedData = data.map((row, i) => ({ ...row, [indexKey]: i }));
    const indices1 = applyFilters(indexedData, groups.current.predicates).map(row => row[indexKey]);
    const indices2 = groups.other.reverted
        ? indexedData.filter((_, i) => !indices1.includes(i)).map(row => row[indexKey])
        : applyFilters(indexedData, groups.other.predicates).map(row => row[indexKey]);

    const exploringFields = fields.filter(f => ![...view.dimensions, ...view.measures.map(ms => ms.fid)].includes(f.fid));
    for (const f of exploringFields) {
        const target = view.measures[0];
        const responsibility = diffGroups(data, indices1, indices2, f, {
            fid: target.fid,
            aggregate: 'sum',
        });
        if (responsibility !== 0) {
            // @ts-ignore
            res.causalEffects.push({
                responsibility,
                src: f.fid,
                tar: target.fid,
                description: {
                    title: 'unvisualizedDimension',
                    key: 'unvisualizedDimension',
                },
            });
        }
           
        // const edge = edges.find(link => link.src === fid && view.measures.find(ms => ms.fid === link.tar));
        // if (f && edge) {
        //     const measure = view.measures.find(ms => ms.fid === edge.tar)!;
        //     const responsibility = diffGroups(data, groups.current.predicates, groups.other.predicates, f, {
        //         fid: measure.fid,
        //         aggregate: measure.op,
        //     });
        //     if (responsibility !== 0) {
        //         res.causalEffects.push({
        //             ...edge,
        //             responsibility,
        //             description: {
        //                 key: 'unvisualizedDimension',
        //             },
        //         });
        //     }
        // }
    }

    res.causalEffects.sort((a, b) => b.responsibility - a.responsibility);

    return res;
};
