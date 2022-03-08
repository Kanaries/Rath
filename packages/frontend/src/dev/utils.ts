import { entropy } from "visual-insights/build/esm/statistics";

export function firstWDis (p1: number[], p2: number[]) {

}

export function l1Dis(p1: number[], p2: number[]) {
    // for (let i )
    let ans = 0;
    const safeLen = Math.min(p1.length, p2.length);
    for (let i = 0; i < safeLen; i++) {
        ans += Math.abs(p1[i] - p2[i]);
    }
    return ans / 2;
}

export function l1Dis2(p1: number[][], p2: number[][]) {
    let total = 0;
    for (let i = 0; i < p1.length; i++ ) {
        for (let j = 0; j < p1[i].length; j++) {
            total += Math.abs(p1[i][j] - p2[i][j])
        }
    }
    return total / 2
}

export function l2Dis2(p1: number[][], p2: number[][]) {
    let total = 0;
    for (let i = 0; i < p1.length; i++ ) {
        for (let j = 0; j < p1[i].length; j++) {
            total += (p1[i][j] - p2[i][j]) ** 2
        }
    }
    return total / 2
}

export function w2dis () {

}
const BIN_SIZE = 16;
export function bin(nums: number[]): number[] {
    let _max = Math.max(...nums);
    let _min = Math.min(...nums);
    let step = (_max - _min) / BIN_SIZE;
    // for (let i = 0; i < nums)
    let dist: number[] = new Array(BIN_SIZE + 1).fill(0);
    for (let i = 0; i < nums.length; i++) {
        let numIndex = Math.floor((nums[i] - _min) / step)
        dist[numIndex % (BIN_SIZE + 1)]++;
    }
    dist[BIN_SIZE - 1] += dist[BIN_SIZE];
    return dist.slice(0, BIN_SIZE)
}

export function binShareRange(nums: number[], _min: number, _max: number): number[] {
    let step = (_max - _min) / BIN_SIZE;
    // for (let i = 0; i < nums)
    let dist: number[] = new Array(BIN_SIZE + 1).fill(0);
    for (let i = 0; i < nums.length; i++) {
        let numIndex = Math.floor((nums[i] - _min) / step)
        dist[numIndex % (BIN_SIZE + 1)]++;
    }
    dist[BIN_SIZE - 1] += dist[BIN_SIZE];
    return dist.slice(0, BIN_SIZE)
}

export function binMap(nums: number[]): number[] {
    let _max = Math.max(...nums);
    let _min = Math.min(...nums);
    let step = (_max - _min) / BIN_SIZE;
    let ans: number[] = [];
    for (let i = 0; i < nums.length; i++) {
        let numIndex = Math.floor((nums[i] - _min) / step)
        if (numIndex === BIN_SIZE) {
            numIndex = BIN_SIZE - 1;
        }
        ans.push(numIndex);
    }
    return ans;
}

export function binMapShareRange(nums: number[], _min: number, _max: number): number[] {
    let step = (_max - _min) / BIN_SIZE;
    let ans: number[] = [];
    for (let i = 0; i < nums.length; i++) {
        let numIndex = Math.floor((nums[i] - _min) / step)
        if (numIndex === BIN_SIZE) {
            numIndex = BIN_SIZE - 1;
        }
        ans.push(numIndex);
    }
    return ans;
}

export function rangeNormilize (fl: number[]): number[] {
    let _sum = 0;
    const pl: number[] = [];
    for (let i = 0; i < fl.length; i++) {
        _sum += fl[i];
    }
    for (let i = 0; i < fl.length; i++) {
        pl.push(fl[i] / _sum);
    }
    return pl
}

export function mic (T: number[], X: number[]) {
    let condH = 0;
    const _min = Math.min(...X)
    const _max = Math.max(...X)
    let H = entropy(rangeNormilize(binShareRange(X, _min, _max).filter(v => v > 0)));
    for (let i = 0; i < BIN_SIZE; i++) {
        const conditionalX = X.filter((x, ti) => T[ti] === i);
        const bins = binShareRange(conditionalX, _min, _max).filter(v => v > 0);
        const subEnt = entropy(rangeNormilize(bins))
        const px = conditionalX.length / X.length;
        condH += px * subEnt;
    }
    return (H - condH) / Math.log2(BIN_SIZE);
}

export function generalMic (T: string[], X: number[]) {
    let condH = 0;
    const _min = Math.min(...X)
    const _max = Math.max(...X)
    let H = entropy(rangeNormilize(binShareRange(X, _min, _max).filter(v => v > 0)));
    const uniqueValueSet = new Set(T);
    const uniqueValues = [...uniqueValueSet];

    const dists: Array<{freq: number; bins: number[]}> = [];

    for (let i = 0; i < uniqueValues.length; i++) {
        const conditionalX = X.filter((x, ti) => T[ti] === uniqueValues[i]);
        const bins = binShareRange(conditionalX, _min, _max)
        dists.push({
            freq: conditionalX.length,
            bins
        })
    }

    dists.sort((a, b) => b.freq - a.freq)
    const noise: {freq: number; bins: number[]} = {
        freq: 0,
        bins: new Array(BIN_SIZE).fill(0)
    };

    for (let i = 0; i < dists.length; i++) {
        const { bins, freq } = dists[i]
        if (i < BIN_SIZE - 1) {
            const subEnt = entropy(rangeNormilize(bins.filter(v => v > 0)))
            const px = freq / X.length;
            condH += px * subEnt;
        } else {
            noise.freq += freq
            for (let j = 0; j < BIN_SIZE; j++) {
                noise.bins[j] += bins[j];
            }
        }
    }
    if (noise.freq > 0) {
        const { bins, freq } = noise
        const subEnt = entropy(rangeNormilize(bins.filter(v => v > 0)))
        const px = freq / X.length;
        condH += px * subEnt;
    }

    // for (let i = 0; i < uniqueValues.length; i++) {
    //     const conditionalX = X.filter((x, ti) => T[ti] === uniqueValues[i]);
    //     const bins = binShareRange(conditionalX, _min, _max).filter(v => v > 0);
    //     const subEnt = entropy(rangeNormilize(bins))
    //     const px = conditionalX.length / X.length;
    //     condH += px * subEnt;
    // }
    return (H - condH) / Math.log2(uniqueValues.length);
}

export function normalizeScatter (points: [number, number][]) {
    let maxX = -Infinity;
    let maxY = -Infinity;
    let minX = Infinity;
    let minY = Infinity;
    for (let i = 0; i < points.length; i++) {
        maxX = Math.max(points[i][0], maxX)
        maxY = Math.max(points[i][1], maxY)
        minX = Math.min(points[i][0], minX)
        minY = Math.min(points[i][1], minY)
    }
    const stepX = (maxX - minX) / BIN_SIZE;
    const stepY = (maxY - minY) / BIN_SIZE;
    const matrix: number[][] = new Array(BIN_SIZE + 1).fill(0).map(() => new Array(BIN_SIZE + 1).fill(0))
    for (let i = 0; i < points.length; i++) {
        // matrix[]
        const indexX = Math.floor((points[i][0] - minX) / stepX);
        const indexY = Math.floor((points[i][1] - minY) / stepY);
        matrix[indexX][indexY]++;
    }
    for (let i = 0; i <= BIN_SIZE; i++) {
        matrix[i][BIN_SIZE - 1] += matrix[i][BIN_SIZE]
        matrix[BIN_SIZE - 1][i] += matrix[BIN_SIZE][i]
    }
    let pbMatrix: number[][] = new Array(BIN_SIZE).fill(0).map(() => new Array(BIN_SIZE).fill(0))
    for (let i = 0; i < BIN_SIZE; i++) {
        for (let j = 0; j < BIN_SIZE; j++) {
            pbMatrix[i][j] = matrix[i][j] / points.length;
        }
    }
    // console.log(pbMatrix)
    return pbMatrix
}

interface IPatternPair {
    X: [number, number][];
    Y: [number, number][];
}
export function incSim (T: string[], pointsX: [number, number][], pointsY: [number, number][]) {
    const S = l2Dis2(normalizeScatter(pointsX), normalizeScatter(pointsY));
    let groups: Map<string, IPatternPair> = new Map()
    for (let i = 0; i < T.length; i++) {
        if (!groups.has(T[i])) {
            const pair: IPatternPair = {
                X: [],
                Y: []
            };
            groups.set(T[i], pair)
        }
        groups.get(T[i])?.X.push(pointsX[i])
        groups.get(T[i])?.Y.push(pointsY[i])
    }
    let condS = 0;
    for (let [gKey, pair] of groups.entries()) {
        let p = pair.X.length / pointsX.length;
        if (p === 0) continue;
        if (pair.X.length < BIN_SIZE ** 2) {
            condS += p;
            continue;
        }
        // let p = 1 / groups.size
        condS += (p * l2Dis2(normalizeScatter(pair.X), normalizeScatter(pair.Y)));
    }
    return S - condS;
}