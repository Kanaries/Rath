import type { IFieldMeta, IRow } from "../interfaces";
import { getRange } from "./stat";


const BIN_SIZE = 16;

/**
 * 将离散字段按 "top K + 其他" 分箱.
 */
const encodeColumn = (data: readonly IRow[], field: IFieldMeta): (val: number | string) => number => {
    const count = new Map<number | string, number>();
    for (const row of data) {
        const value = row[field.fid];
        count.set(value, (count.get(value) ?? 0) + 1);
    }
    const freqDescending: { origin: number | string; count: number }[] = [];
    for (const [origin, cnt] of count.entries()) {
        freqDescending.push({ origin, count: cnt });
    }
    freqDescending.sort((a, b) => b.count - a.count);
    const encoder = new Map<number | string, number>();
    for (const { origin, index } of freqDescending.slice(0, BIN_SIZE - 1).map((item, index) => ({ origin: item.origin, index }))) {
        encoder.set(origin, index);
    }
    return val => encoder.get(val) ?? (BIN_SIZE - 1);
};

const HashSymbol = Symbol('hash');

/**
 * 将每一行散列到一个从 0 起的序号.
 */
const hashAll = (data: readonly IRow[], fields: readonly IFieldMeta[]): readonly (IRow & { [HashSymbol]: number })[] => {
    const hash: { [fid: string]: (val: string | number) => number } = {};
    for (const f of fields) {
        if (f.semanticType === 'quantitative' || f.semanticType === 'temporal') {
            const [min, max] = getRange(data.map(row => row[f.fid]));
            hash[f.fid] = val => Math.min(BIN_SIZE, (val as number - min) / (max - min) * BIN_SIZE);
        } else {
            hash[f.fid] = encodeColumn(data, f);
        }
    }
    const codeMap = new Map<string, number>();
    const rows: (IRow & { [HashSymbol]: number })[] = data.map(row => {
        const r = row;
        let code = '';
        for (const f of fields) {
            code += hash[f.fid](r[f.fid]);
        }
        if (!codeMap.has(code)) {
            codeMap.set(code, codeMap.size);
        }
        const idx = codeMap.get(code)!
        return {
            ...r,
            [HashSymbol]: idx,
        };
    });
    return rows;
};

type OrderedDistribution = {
    /** 之前所有值的权重和，这个值开始的位置 */
    offset: number;
    /** 目前所有值的权重和，这个值结束的位置 */
    end: number;
    weight: number;
    /** 对应的原始数据下标 */
    index: number;
};

const weightedDistribution = (data: readonly { [HashSymbol]: number }[]): OrderedDistribution[] => {
    const count = new Map<number, number>();
    for (const row of data) {
        const code = row[HashSymbol];
        count.set(code, (count.get(code) ?? 0) + 1);
    }
    let offset = 0;
    return data.map<OrderedDistribution>((row, i) => {
        const position = offset;
        // FIXME: 权重怎样设计
        const weight = count.get(row[HashSymbol])! / data.length;
        offset += weight;
        return {
            offset: position,
            end: offset,
            weight,
            index: i,
        };
    });
};

/**
 * 通过有序的分布列定位到目标元素，取出该元素下标.
 */
const getCursor = (distribution: OrderedDistribution[], cursor: number, begin = 0, end = distribution.length): number => {
    const midIdx = Math.floor((begin + end) / 2);
    const mid = distribution[midIdx];
    if (cursor >= mid.offset && cursor < mid.end) {
        // 在目标范围内
        return midIdx;
    } else if (cursor < mid.offset) {
        return getCursor(distribution, cursor, begin, midIdx);
    } else {
        return getCursor(distribution, cursor, midIdx + 1, end);
    }
};

/**
 * @param {readonly IRow[]} fullSet 数据全集
 * @param {readonly IFieldMeta[]} focusedFields 需要保持分布的列
 * @param {number} sampleSize 期望样本大小
 * @return {readonly number[]} 样本索引列表
 */
export const focusedSample = (fullSet: readonly IRow[], focusedFields: readonly IFieldMeta[], sampleSize: number): readonly number[] => {
    if (sampleSize >= fullSet.length) {
        return fullSet.map((_, i) => i);
    } else if (sampleSize <= 0) {
        return [];
    }
    // 实现思路是加权
    const data = hashAll(fullSet, focusedFields);
    const remaining = weightedDistribution(data);
    const indices: number[] = [];
    while (indices.length < sampleSize && remaining.length) {
        const sum = remaining.at(-1)!.end;
        const cursor = Math.random() * sum;
        const idx = getCursor(remaining, cursor);
        const which = remaining[idx];
        // 更新后续元素
        for (const dist of remaining.slice(idx + 1)) {
            dist.offset -= which.weight;
            dist.end -= which.weight;
        }
        remaining.splice(idx, 1);
        indices.push(which.index);
    }
    return indices;
};
