import { OutlierBase } from './base';
export const EULER = 0.5772156649;
export function sampleing<T = any> (arr: T[], size: number): T[] {
    if (arr.length <= size) return arr;
    let choosen = arr.map(() => false);
    let samples: T[] = [];
    let count = 0;
    while (count < size) {
        let index = Math.floor(Math.random() * size)
        while (choosen[index]) {
            index++;
        }
        if (!choosen[index]) {
            choosen[index] = true;
            samples.push(arr[index]);
            count++;
        }
    }
    return samples;
}
    
interface IITree {
    field: number;
    exNode: boolean;
    value: number;
    size: number;
    left?: IITree | null;
    right?: IITree | null;
}
export class IsolationForest extends OutlierBase {
    private max_depth: number = 100;
    private iforest: IITree[];
    private subsampling_size: number;
    private tree_num: number;
    private contamination: 'auto' | number;
    public constructor (subsampling_size: number = 256, tree_num: number = 100, contamination: 'auto' | number = 'auto') {
        super();
        this.iforest = [];
        this.subsampling_size = subsampling_size;
        this.tree_num = tree_num;
        this.contamination = contamination;
    }
    private iTree (samples: number[][], depth: number): IITree {
        if (samples.length <= 1 || depth >= this.max_depth) {
            return {
                field: 0,
                exNode: true,
                value: 0,
                size: samples.length,
                left: null,
                right: null
            }
        }
        let fieldIndex: number = Math.floor(Math.random() * samples[0].length);
        let max = -Infinity;
        let min = Infinity;
        for (let i = 0; i < samples.length; i++) {
            max = Math.max(max, samples[i][fieldIndex]);
            min = Math.min(min, samples[i][fieldIndex]);
        }
        const splitValue = (max - min) * Math.random() + min;
        let itree: IITree = {
            field: fieldIndex,
            exNode: false,
            value: splitValue,
            size: samples.length,
            left: null,
            right: null
        }
        itree.left = this.iTree(samples.filter(s => s[fieldIndex] < splitValue), depth + 1);
        itree.right = this.iTree(samples.filter(s => s[fieldIndex] >= splitValue), depth + 1);
        return itree;
    }

    private pathLength(x: number[], itree: IITree | null | undefined, depth: number): number {
        if (itree === null || itree === undefined) return 0;
        if (itree.exNode || depth >= this.max_depth) {
            return IsolationForest.AFS(itree.size);
        }
        const fieldIndex = itree.field;
        if (x[fieldIndex] < itree.value) return this.pathLength(x, itree.left, depth + 1) + 1;
        return this.pathLength(x, itree.right, depth + 1) + 1;
    }


    private iForest (samples: number[][]): IITree[] {
        if (samples.length === 0) throw new Error('isolation forest requires non-empty samples')
        for (let i = 0; i < this.tree_num; i++){
            const subsamples = sampleing(samples, this.subsampling_size);
            const itree = this.iTree(subsamples, 0);
            this.iforest.push(itree);
        }
        return this.iforest;
    }

    /**
     * average unsuccessful searches in BST (Preiss, 1999)
     * @param Psi 
    */
    public static AFS(Psi: number): number {
        if (Psi > 2) return 2 * (Math.log(Psi - 1) + EULER) - 2 * (Psi - 1) / Psi;
        if (Psi === 2) return 1;
        return 0;
    }

    public anomalyScore(x: number[]) {
        const { iforest, subsampling_size } = this;
        let avgPathLength = 0;
        for (let  i = 0; i < iforest.length; i++) {
            avgPathLength += this.pathLength(x, iforest[i], 0);
        }
        avgPathLength /= iforest.length;
        const avgNormalization = IsolationForest.AFS(subsampling_size);
        return Math.pow(2, -avgPathLength / avgNormalization);
    }

    public fit (samplesX: number[][]) {
        this.max_depth = Math.ceil(Math.log2(Math.max(samplesX.length, 2)))
        this.subsampling_size = Math.min(this.subsampling_size, samplesX.length)
        this.iForest(samplesX);
    }

    public predict (samples: number[][]) {
        let result: number[] = [];
        for (let i = 0; i < samples.length; i++) {
            result.push(this.anomalyScore(samples[i]))
        }
        if (this.contamination === 'auto') {
            return result.map(r => r > 0.5 ? 1 : 0)
        }
        const sortResult: Array<{value: number; index: number}> = result.map((r, index) => ({
            value: r,
            index
        }));
        sortResult.sort((a, b) => b.value - a.value);
        const isOutlierIndices: Set<number> = new Set();
        const topIndex = Math.floor(this.contamination * samples.length);
        for (let i = 0; i < topIndex; i++) {
            isOutlierIndices.add(sortResult[i].index);
        }
        return result.map((r, i) => isOutlierIndices.has(i) ? 1 : 0);
    }
}