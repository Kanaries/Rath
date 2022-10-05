import { entropy, IRow, liteGroupBy, rangeNormilize } from '@kanaries/loa';
const BIN_SIZE = 16

export function vecAdd (mutVec: number[], inc: number[]) {
    const size = Math.min(mutVec.length, inc.length);
    for (let i = 0; i < size; i++) {
        mutVec[i] += inc[i];
    }
}

export function getFreqMap (values: any[]): Map<any, number> {
    const counter: Map<any, number> = new Map();
    for (let val of values) {
        if (!counter.has(val)) {
            counter.set(val, 0)
        }
        counter.set(val, counter.get(val)! + 1)
    }
    return counter
}

export function getFreqRange (values: any[]): [any, number][] {
    const FM = getFreqMap(values);
    const sortedFM = [...FM.entries()].sort((a, b) => b[1] - a[1])
    return sortedFM.slice(0, BIN_SIZE);
}

export function binGroupByShareFreqRange (Y: any[], range: any[]): number[] {
    const fl: number[] = new Array(range.length).fill(0);
    const rangeIndices: Map<any, number> = new Map();
    // for (let val of range) {
    for (let i = 0; i < range.length; i++) {
        rangeIndices.set(range[i], i);
    }
    for (let val of Y) {
        if (rangeIndices.has(val)) {
            fl[rangeIndices.get(val)!]++;
        } else {
            fl[fl.length - 1]++;
        }
    }
    return fl;
}

export function nnMic (X: any[], Y: any[]) {
    // const FM = getFreqMap(Y);
    // const globalRange = [...FM.keys()];
    const globalRange = getFreqRange(Y)

    const groups = liteGroupBy(Y, X)

    const sortedGroup = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
    // for (let group of sortedGroup)
    let usedGroupNum = sortedGroup.length
    // debugger
    let i = 0;
    let condH = 0;
    let globalFl = new Array(globalRange.length).fill(0);
    for (i = 0; i < usedGroupNum; i++) {
        const p = sortedGroup[i][1].length / Y.length;
        const subFl = binGroupByShareFreqRange(sortedGroup[i][1], globalRange.map(g => g[0]))
        const subEnt = entropy(rangeNormilize(subFl.filter(v => v > 0)))
        condH += subEnt * p;
        vecAdd(globalFl, subFl);
    }

    const H = entropy(rangeNormilize(globalFl.filter(v => v > 0)))
    return (H - condH) / Math.log2(globalRange.length)

}

export function batchMutInRange (mutData: IRow, field: string, range: [number, number], key: string, value: any) {
    for (let i = 0; i < mutData.length; i++) {
        if (mutData[i][field] >= range[0] && mutData[i][field] <= range[1]) {
            mutData[i][key] = value;
        }
    }
}

interface BatchMutInCircleProps {
    mutData: IRow;
    fields: [string, string];
    point: [number, number];
    r: number;
    a: number;
    b: number;
    key: string;
    value: any;
    indexKey: string;
}
export function batchMutInCircle (props: BatchMutInCircleProps) {
    const {
        mutData,
        fields,
        point,
        a,
        b,
        r,
        key,
        value,
        indexKey
    } = props;
    const mutIndices = new Set();
    const mutValues: IRow[] = [];
    for (let i = 0; i < mutData.length; i++) {
        if (((mutData[i][fields[0]] - point[0]) ** 2) / (a ** 2) + ((mutData[i][fields[1]] - point[1]) ** 2) / (b ** 2) <= (r ** 2)) {
            if (mutData[i][key] !== value) {
                mutData[i][key] = value;
                mutValues.push(mutData[i])
                mutIndices.add(mutData[i][indexKey])
            }
        }
    }
    return {
        mutIndices,
        mutValues
    }
}

interface BatchMutInCatRangeProps {
    mutData: IRow;
    fields: [string, string];
    point: [any, number];
    r: number;
    range: number;
    key: string;
    value: any;
    indexKey: string;
}
export function batchMutInCatRange (props: BatchMutInCatRangeProps) {
    const {
        mutData,
        fields,
        point,
        r,
        range,
        key,
        value,
        indexKey
    } = props;
    const mutIndices = new Set();
    const mutValues: IRow[] = [];
    for (let i = 0; i < mutData.length; i++) {
        if (mutData[i][fields[0]] === point[0]) {
            if (Math.abs(mutData[i][fields[1]] - point[1]) < r * Math.sqrt(range)) {
                if (mutData[i][key] !== value) {
                    mutData[i][key] = value;
                    mutValues.push(mutData[i])
                    mutIndices.add(mutData[i][indexKey])
                }
            }
        }
    }
    return {
        mutIndices,
        mutValues
    }
}