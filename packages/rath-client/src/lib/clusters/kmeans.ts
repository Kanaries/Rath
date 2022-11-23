export abstract class ClusterBase {
    public abstract fitPredict(trainX: number[][], trainY: number[]): void;
}

export class KMeans extends ClusterBase {
    private n_clusters: number;
    private centers: number[][] | null;
    private samplesX: number[][];
    private samplesY: number[];
    private sampleWeights: number[];
    private opt_ratio: number;
    private objective: number;
    private max_iter: number;
    private iter: number;
    constructor(props: {
        n_clusters: number; opt_ratio: number; initCenters?: number[][]; max_iter: number
    }) {
        super();
        const {n_clusters = 2, opt_ratio = 0.05, initCenters, max_iter = 30} = props;
        this.n_clusters = n_clusters;
        this.centers = null;
        this.samplesX = [];
        this.samplesY = [];
        this.sampleWeights = [];
        this.objective = 0;
        this.max_iter = max_iter;
        this.iter = 0;
        this.opt_ratio = opt_ratio;
        if (initCenters) {
            this.centers = initCenters;
        }
    }
    private assignment(): void {
        const { centers, samplesX } = this;
        if (centers === null) {
            throw new Error('Centroids not initialized');
        }
        const samplesY = samplesX.map(() => 0);
        let objective: number = 0;
        for (let i = 0; i < samplesX.length; i++) {
            let nearestIndex = 0;
            let nearestDis = Infinity;
            for (let j = 0; j < centers.length; j++) {
                const dis_square = centers[j].reduce((sum, value, index) => sum + (value - samplesX[i][index]) ** 2, 0);
                const dis = Math.sqrt(dis_square);
                if (dis < nearestDis) {
                    nearestDis = dis;
                    nearestIndex = j;
                }
            }
            samplesY[i] = nearestIndex;
            objective += nearestDis;
        }
        this.samplesY = samplesY;
        this.iter++;

        if (this.iter <= this.max_iter || objective < this.objective * (1 - this.opt_ratio)) {
            // if (this.iter <= this.max_iter) { for visual test
            this.objective = objective;
            this.updateCentroids();
            this.assignment();
        }
    }
    private updateCentroids(): void {
        const { n_clusters, samplesX, samplesY, sampleWeights } = this;
        const centers: number[][] = []; // = new Array(n_clusters).fill(0);
        const featureSize = samplesX[0].length;
        for (let i = 0; i < n_clusters; i++) {
            centers.push(new Array(featureSize).fill(0));
        }
        let neighborCounter: number[] = new Array(n_clusters).fill(0);
        for (let i = 0; i < samplesX.length; i++) {
            let centerIndex = samplesY[i];
            // centers[centerIndex]
            neighborCounter[centerIndex] += sampleWeights[i];
            for (let j = 0; j < centers[centerIndex].length; j++) {
                centers[centerIndex][j] += samplesX[i][j] * sampleWeights[i];
            }
        }
        for (let i = 0; i < centers.length; i++) {
            for (let j = 0; j < centers[i].length; j++) {
                centers[i][j] /= neighborCounter[i];
            }
        }
        this.centers = centers;
    }
    private initCentroids(): void {
        const randSet: Set<number> = new Set();
        this.centers = [];
        let randIndex: number = 0;
        for (let i = 0; i < this.n_clusters; i++) {
            do {
                randIndex = Math.floor(Math.random() * this.samplesX.length);
            } while (randSet.has(randIndex));
            randSet.add(randIndex);
            this.centers.push(this.samplesX[randIndex]);
        }
    }
    public fitPredict(sampleX: number[][], sampleWeights?: number[]) {
        if (sampleWeights) {
            this.sampleWeights = sampleWeights;
        } else {
            this.sampleWeights = sampleX.map(() => 1);
        }
        this.samplesX = sampleX;
        this.objective = Infinity;
        this.iter = 0;
        if (this.centers === null) {
            this.initCentroids();
        }
        // this.initCentroids();
        this.assignment();
        return this.samplesY;
    }
    public getCentroids () {
        return this.centers;
    }
}