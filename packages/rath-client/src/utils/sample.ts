import dayjs from "dayjs";
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
    return val => {
        const idx = encoder.get(val);
        return Number.isFinite(idx) ? idx! : BIN_SIZE - 1;
    };
};

const HashSymbol = Symbol('hash');

type HashedRow = Readonly<IRow> & { [HashSymbol]: number[] };

type HashResult = {
    /** 散列后的原始数据 */
    rows: readonly HashedRow[];
    /** 每个维度的分箱数量 */
    sizes: readonly number[];
};

/**
 * 将每一行散列到一个高维坐标.
 */
const hashAll = (data: readonly IRow[], fields: readonly IFieldMeta[]): HashResult => {
    const hash: { [fid: string]: (val: string | number) => number } = {};
    for (const f of fields) {
        if (f.semanticType === 'quantitative') {
            const [min, max] = getRange(data.map(row => Number(row[f.fid])));
            hash[f.fid] = val => Math.min(BIN_SIZE - 1, Math.floor((Number(val) - min) / (max - min) * BIN_SIZE));
        } else if (f.semanticType === 'temporal') {
            const [min, max] = getRange(data.map(row => dayjs(row[f.fid]).toDate().getTime()));
            hash[f.fid] = val => Math.min(BIN_SIZE - 1, Math.floor((dayjs(val).toDate().getTime() - min) / (max - min) * BIN_SIZE));
        } else {
            hash[f.fid] = encodeColumn(data, f);
        }
    }
    const max = fields.map(_ => 0);
    const rows: (IRow & { [HashSymbol]: number[] })[] = data.map(row => {
        const coord = fields.map(f => hash[f.fid](row[f.fid]));
        for (let i = 0; i < max.length; i += 1) {
            max[i] = Math.max(max[i], coord[i]);
        }
        return {
            ...row,
            [HashSymbol]: coord,
        };
    });
    return { rows, sizes: max.map(m => m + 1) };
};

type SampleTreeNode = {
    /** 坐标起始范围（含） */
    readonly start: readonly number[];
    /** 坐标终止范围（不含） */
    readonly end: readonly number[];
    /** 包含数据，只有叶子结点有，非叶子结点 data 为空数组 */
    data: {
        index: number;
        coord: number[];
    }[];
    children: [] | [SampleTreeNode, SampleTreeNode];
};

const splitTreeNode = (parent: SampleTreeNode, splitThreshold: number): SampleTreeNode => {
    if (parent.data.length <= splitThreshold || parent.start.every((begin, i) => parent.end[i] - begin <= 1)) {
        // 结点内所含样本小于分割阈值，或者已经确定到唯一一个分箱不能再分割
        return parent;
    }
    // 找到最宽的一个维度应用切割
    const splitCoord = parent.end.reduce<{ idx: number; width: number }>((target, end, idx) => {
        const width = end - parent.start[idx];
        if (width >= 2 && width > target.width) {
            return { idx, width };
        }
        return target;
    }, { idx: -1, width: 0 });
    if (splitCoord.idx === -1) {
        return parent;
    }
    const splitPos = parent.start[splitCoord.idx] + Math.floor(splitCoord.width / 2);
    const mid = parent.start.map((pos, idx) => idx === splitCoord.idx ? splitPos : pos);
    const left: SampleTreeNode = {
        start: parent.start,
        end: mid,
        data: [],
        children: [],
    };
    const right: SampleTreeNode = {
        start: mid,
        end: parent.end,
        data: [],
        children: [],
    };
    parent.data.splice(0, parent.data.length).forEach(row => {
        if (row.coord[splitCoord.idx] < splitPos) {
            left.data.push(row);
        } else {
            right.data.push(row);
        }
    });
    parent.children = [
        splitTreeNode(left, splitThreshold),
        splitTreeNode(right, splitThreshold)
    ];
    return parent;
};

const getBinsFromSampleTree = (tree: SampleTreeNode): number[][] => {
    const bins: number[][] = [];
    if (tree.children.length > 0) {
        for (const child of tree.children) {
            getBinsFromSampleTree(child).forEach(bin => bins.push(bin));
        }
    } else {
        // 是叶子结点
        const bin = tree.data.map(d => d.index);
        bins.push(bin);
    }
    return bins;
};

/**
 * 用多维空间树结构把原始数据转换成一维分箱.
 * @param {HashResult} hashed 散列结果
 * @param {number} splitThreshold 当结点内的数据量小于等于这个值时，停止划分
 * @returns {readonly (readonly number[])[]} 分箱结果，每一个子列表代表一个箱，存放原始数据的下标索引
 */
const treeSplit = (hashed: HashResult, splitThreshold: number): readonly (readonly number[])[] => {
    const root = splitTreeNode({
        start: hashed.sizes.map(_ => 0),
        end: hashed.sizes,
        data: hashed.rows.map((row, index) => ({
            index,
            coord: row[HashSymbol],
        })),
        children: [],
    }, splitThreshold);
    const bins = getBinsFromSampleTree(root);
    return bins;
};

const sampleBin = (bin: readonly number[], sampleSize: number): readonly number[] => {
    if (sampleSize > bin.length / 2) {
        const indices = bin.map(idx => idx);
        while (indices.length > sampleSize) {
            indices.splice(Math.floor(indices.length * Math.random()), 1);
        }
        return indices;
    }

    const fullSet = bin.map(idx => idx);
    const indices: number[] = [];
    while (indices.length < sampleSize) {
        const [index] = fullSet.splice(Math.floor(fullSet.length * Math.random()), 1);
        indices.push(index);
    }
    return indices;
};

const sampleBins = (bins: readonly (readonly number[])[], originSize: number, sampleSize: number): readonly number[] => {
    const targetSampleSizes = bins.map(bin => Math.floor(bin.length / originSize * sampleSize));
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const diff = sampleSize - targetSampleSizes.reduce<number>((sum, size) => sum + size, 0);
        if (diff > 0) {
            const binsShouldIncreaseIndices = bins.map((bin, idx) => ({
                idx,
                // bin.length 可能为 0 不要直接除
                sampleRate: bin.length === targetSampleSizes[idx] ? 1 : targetSampleSizes[idx] / bin.length,
            })).filter(bin => bin.sampleRate < 1).sort((a, b) => a.sampleRate - b.sampleRate).slice(0, diff).map(bin => bin.idx);
            binsShouldIncreaseIndices.forEach(idx => {
                targetSampleSizes[idx] += 1;
            });
        } else {
            break;
        }
    }
    return bins.reduce<number[]>((indices, bin, idx) => {
        return indices.concat(sampleBin(bin, targetSampleSizes[idx]));
    }, []).sort((a, b) => a - b);
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
    const hashed = hashAll(fullSet, focusedFields);
    const bins = treeSplit(hashed, fullSet.length / Math.sqrt(sampleSize));
    const indices = sampleBins(bins, fullSet.length, Math.floor(sampleSize));

    return indices;
};
