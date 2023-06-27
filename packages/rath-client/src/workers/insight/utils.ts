import { applyFilters } from "@kanaries/loa";
import dayjs from "dayjs";
import { cramersV } from "visual-insights/build/esm/statistics";
import type { IFieldMeta, IRow } from "../../interfaces";
import { getRange } from "../../utils";
import type { IRInsightExplainProps, IRInsightExplainResult } from "./r-insight.worker";


const MAX_BIN = 48; // some enum may includes too many items, e.g. hour

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

const xAggregate = (data: IRow[], field: IFieldMeta, aggregate: AggregateType): number[] => {
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
            break;
        }
        case 'sum': {
            for (let i = 0; i < col.length; i += 1) {
                const row = data[i];
                const idx = row[hashIndexKey];
                const w = col[i];
                res[idx] += w;
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
                count[idx] += 1;
            }
            for (let i = 0; i < res.length; i += 1) {
                res[i] /= count[i];
            }
            break;
        }
        default: {
            break;
        }
    }
    return res;
};

const xNormalize = (col: number[]): number[] => {
    const sum = col.reduce<number>((sum, val) => {
        if (Number.isFinite(val)) {
            return sum + Math.abs(val);
        }
        return sum;
    }, 0);
    return col.map(val => {
        return Math.abs(val) / sum;
    });
};

const xBin = (...indices: number[][]): { binSize: number; flat: number[] } => {
    const getFlatBinKey = (keys: number[]) => keys.map(key => `${key}`).join(',');
    const distribution = new Map<string, number>();
    const flatBinKeys: string[] = [];
    for (let i = 0; i < indices[0].length; i += 1) {
        const keys = indices.map(col => col[i]);
        const binKey = getFlatBinKey(keys);
        flatBinKeys.push(binKey);
        distribution.set(binKey, (distribution.get(binKey) ?? 0) + 1);
    }
    const maxBin = (MAX_BIN ** indices.length) / (2 ** (indices.length - 1));
    const keys: [string, number][] = [];
    for (const [key, count] of distribution) {
        keys.push([key, count]);
    }
    keys.sort((a, b) => b[1] - a[1]).splice(maxBin - 1, Infinity);
    const projector = new Map<string, number>();
    for (const key of keys) {
        projector.set(key[0], projector.size);
    }
    return {
        binSize: maxBin,
        flat: flatBinKeys.map(key => projector.get(key) ?? (maxBin - 1)),
    };
};

const xFreq = (binSize: number, binned: number[]): number[] => {
    const res = new Array<number>(binSize).fill(0);
    for (const key of binned) {
        res[key] = res[key] + 1;
    }
    return res;
};

const DIFF_IGNORE_THRESHOLD = 0.075;

const diffGroups = (
    data: IRow[],
    indices1: number[],
    indices2: number[],
    dimension: IFieldMeta,
    measure: { field: IFieldMeta; aggregate: AggregateType | null },
): number => {
    const hashIndices = xHash(data, dimension);
    const hashedData = data.map((row, i) => ({
        ...row,
        [hashIndexKey]: hashIndices[i],
    }));
    const data1 = indices1.map(index => hashedData[index]);
    const data2 = indices2.map(index => hashedData[index]);
    if (!measure.aggregate) {
        const measureHashIndices1 = xHash(data1, measure.field);
        const measureHashIndices2 = xHash(data2, measure.field);
        const col1 = data1.map(d => d[hashIndexKey]);
        const col2 = data2.map(d => d[hashIndexKey]);
        const binned1 = xBin(col1, measureHashIndices1);
        const binned2 = xBin(col2, measureHashIndices2);
        const freq1 = xFreq(binned1.binSize, binned1.flat);
        const freq2 = xFreq(binned2.binSize, binned2.flat);
        const group1 = xNormalize(freq1);
        const group2 = xNormalize(freq2);
        const diff = new Array<0>(binned1.binSize).fill(0).reduce<number>((score, _, i) => {
            const a = group1[i];
            const b = group2[i];
            const ignoreLoss = b !== 0 && Math.abs(1 - (a / b) / b) <= DIFF_IGNORE_THRESHOLD;
            const loss = ignoreLoss ? 0 : Math.abs(a - b) / 2;
            return score + loss;
        }, 0);
        return diff;
    }
    const aggregated1 = xAggregate(data1, measure.field, measure.aggregate);
    const aggregated2 = xAggregate(data2, measure.field, measure.aggregate);
    const group1 = xNormalize(aggregated1);
    const group2 = xNormalize(aggregated2);
    const diff = new Array<0>(MAX_BIN).fill(0).reduce<number>((score, _, i) => {
        const a = group1[i];
        const b = group2[i];
        const ignoreLoss = b !== 0 && Math.abs(1 - (a / b) / b) <= DIFF_IGNORE_THRESHOLD;
        const loss = ignoreLoss ? 0 : Math.abs(a - b) / 2;
        return score + loss;
    }, 0);
    return diff;
};

const RELATION_THRESHOLD = 0.7;

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
        for (const target of view.measures) {
            const measure = fields.find(which => which.fid === target.fid);
            if (!measure) {
                continue;
            }
            if (view.dimensions.some(dim => cramersV(data.slice(0), dim, f.fid) >= RELATION_THRESHOLD)) {
                continue;
            }
            const responsibility = diffGroups(data.slice(0), indices1, indices2, f, {
                field: measure,
                aggregate: target.op,
            });
    
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
