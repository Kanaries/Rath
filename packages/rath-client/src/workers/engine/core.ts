
import { getCombination } from '@kanaries/loa';
import { IInsightSpace, InsightFlow, Cube, ViewSpace,  } from 'visual-insights'
import { IRow, PreferencePanelConfig } from '../../interfaces';
import { IVizSpace } from '../../store/megaAutomation';
import { isSetEqual } from '../../utils';
// import { setStateInStorage } from '../../utils/storage';
import { intersect, setStateInStorage } from './utils';

const { VIEngine, DataGraph } = InsightFlow

export function entropyAcc (fl: number[]) {
    let total = 0;
    for (let i = 0; i < fl.length; i++) {
        total += fl[i];
    }
    let tLog = Math.log2(total);
    let ent = 0;
    for (let i = 0; i < fl.length; i++) {
        ent = ent + fl[i] * (Math.log2(fl[i]) - tLog) / total
    }
    return -ent;
}

class CustomDataGraph extends DataGraph {

    // public clusterDGraph(dataSource: IRow[], CORRELATION_THRESHOLD?: number) {
    //     const { dimensions, DIMENSION_CORRELATION_THRESHOLD } = this;
    //     // console.log(JSON.stringify(this.DG))
    //     // this.DClusters = getDimClusterGroups(
    //     //     this.DG,
    //     //     dimensions,
    //     //     CORRELATION_THRESHOLD || DIMENSION_CORRELATION_THRESHOLD
    //     // );
    //     const threshold = CORRELATION_THRESHOLD || DIMENSION_CORRELATION_THRESHOLD;
    //     const DG = this.DG;
    //     const clusters: string[][] = [];
    //     for (let i = 0; i < dimensions.length; i++) {
    //         const groups: string[] = []
    //         for (let j = 0; j < dimensions.length; j++) {
    //             if (DG[i][j] >= threshold) {
    //                 groups.push(dimensions[j]);
    //             }
    //         }
    //         clusters.push(groups)
    //     }
    //     let uniqueClusters: string[][] = [];
    //     for (let i = 0; i < clusters.length; i++) {
    //         let unique = true
    //         for (let j = i + 1; j < clusters.length; j++) {
    //             if (isSetEqual(clusters[i], clusters[j])) {
    //                 unique = false;
    //                 break;
    //             }
    //         }
    //         if (unique) {
    //             uniqueClusters.push(clusters[i])
    //         }
    //     }
    //     this.DClusters = uniqueClusters
    //     return uniqueClusters//this.DClusters;
    // }
    public clusterMGraph(dataSource: IRow[], CORRELATION_THRESHOLD?: number) {
        const { measures, MEASURE_CORRELATION_THRESHOLD } = this;
        // console.log(JSON.stringify(this.MG))
        // this.DClusters = getDimClusterGroups(
        //     this.MG,
        //     measures,
        //     CORRELATION_THRESHOLD || MEASURE_CORRELATION_THRESHOLD
        // );
        const threshold = CORRELATION_THRESHOLD || MEASURE_CORRELATION_THRESHOLD;
        const MG = this.MG;
        const clusters: string[][] = [];
        for (let i = 0; i < measures.length; i++) {
            const groups: string[] = []
            for (let j = 0; j < measures.length; j++) {
                if (MG[i][j] >= threshold) {
                    groups.push(measures[j]);
                }
            }
            clusters.push(groups)
        }
        let uniqueClusters: string[][] = [];
        for (let i = 0; i < clusters.length; i++) {
            let unique = true
            for (let j = i + 1; j < clusters.length; j++) {
                if (isSetEqual(clusters[i], clusters[j])) {
                    unique = false;
                    break;
                }
            }
            if (unique) {
                uniqueClusters.push(clusters[i])
            }
        }
        this.MClusters = uniqueClusters
        return uniqueClusters
    }
    // computeDGraph(dataSource: IRow[], cc?: CorrelationCoefficient): number[][] {
    //     super.computeDGraph(dataSource, cc);
    //     for (let i = 0; i < this.DG.length; i++) {
    //         let maxIndex = 0;
    //         let maxVal = 0;
    //         for (let j = 0; j < this.DG.length; j++) {
    //             if (i === j) continue;
    //             if (this.DG[i][j] > maxVal) {
    //                 maxVal = Math.abs(this.DG[i][j]);
    //                 maxIndex = j;
    //             }
    //         }
    //         for (let j = 0; j < this.DG.length; j++) {
    //             this.DG[i][j] = 0;
    //         }
    //         if (maxVal > this.DIMENSION_CORRELATION_THRESHOLD) {
    //             this.DG[i][maxIndex] = 1;
    //         }
    //     }
    //     // console.log(JSON.stringify(this.DG))
    //     return this.DG;
    // }
}
export class RathEngine extends VIEngine {
    public params: {
        limit: PreferencePanelConfig['viewSizeLimit']
    } = {
        limit: {
            dimension: 2,
            measure: 3
        }
    }
    public constructor() {
        super();
        // this.workerCollection.register('clusters', KNNClusterWorker);
        // this.workerCollection.enable('clusters', true);
        // this.DIMENSION_NUM_IN_VIEW = {
        //     MIN: 0,
        //     MAX: 3
        // }
        // vie.workerCollection.register('identity', identityWorker);
        // vie.workerCollection.enable(DefaultIWorker.outlier, false);
        // vie.workerCollection.enable(DefaultIWorker.trend, false);
    }
    public async buildCube(injectCube?: Cube) {
        const { measures, dataSource, dataGraph, dimensions, aggregators } = this;
        let cube: Cube = injectCube || new Cube({
            dimensions,
            measures,
            dataSource,
            ops: aggregators
        });
        await cube.buildBaseCuboid();
        await Promise.all(dataGraph.DClusters.map((group) => cube.buildCuboidOnCluster(group)))
        this.cube = cube;
        return this;
    }
    public async createInsightSpaces(viewSpaces: ViewSpace[] = this.subSpaces): Promise<IInsightSpace[]> {
        const uniqueSet: Set<string> = new Set()
        let uniqueViews = viewSpaces.filter(s => {
            const k = s.dimensions.join('-') + '||' + s.measures.join('-');
            if (uniqueSet.has(k)) return false;
            uniqueSet.add(k)
            return true
        })
        const ansSpaces = await this.exploreViews(uniqueViews);
        this.insightSpaces = ansSpaces;
        return ansSpaces
    }
    public buildGraph(): this {
        this.dataGraph = new CustomDataGraph(this.dimensions, this.measures);
        this.dataGraph.computeDGraph(this.dataSource);
        this.dataGraph.computeMGraph(this.dataSource);
        if (this.dimensions.length < 5) {
            this.dataGraph.DIMENSION_CORRELATION_THRESHOLD = -100
        }
        return this;
    }
    public async searchPointInterests(viewSpace: ViewSpace) {
        // const globalMeasures = this.measures;
        let ansSet: any[] = []
        if (viewSpace.dimensions.length > 0 && this.cube !== null) {
            const viewCuboid = await this.cube.getCuboid(viewSpace.dimensions);
            const globalCuboid = await this.cube.getCuboid([]);
            const globalDist = await globalCuboid.getAggregatedRows(viewSpace.measures, viewSpace.measures.map(() => 'dist'));
            const localDist = await viewCuboid.getAggregatedRows(viewSpace.measures, viewSpace.measures.map(() => 'dist'))
            if (globalDist.length === 0) return ansSet;
            const globalDistMapByMeasure: Map<string, number[]> = new Map();
            for (let mea of viewSpace.measures) {
                const _sum: number = globalDist[0][mea].reduce((total: number, value: number) => total + value, 0)
                const pbDist: number[] = globalDist[0][mea].map((v: number) => v / _sum)
                globalDistMapByMeasure.set(mea, pbDist);
            }
            for (let ld of localDist) {
                let EKL = 0;
                for (let mea of viewSpace.measures) {
                    let kl = 0;
                    const globalPbDist: number[] = globalDistMapByMeasure.get(mea)!;
                    const localDist: number[] = ld[mea];
                    const localSum: number = localDist.reduce((total, value) => total + value, 0);
                    for (let b = 0; b < globalPbDist.length; b++) {
                        const px = localDist[b] / localSum;
                        const py = globalPbDist[b]
                        if (px > 0 && py > 0) {
                            kl += px * Math.log2(px / py)
                        }
                    }
                    EKL += kl;
                }
                EKL /= viewSpace.measures.length
                ansSet.push({
                    ...ld,
                    kl: EKL
                })
            }
        } else {
            // todo
        }
        ansSet.sort((a, b) => b.kl - a.kl)
        return ansSet
    }
    public async associate(space: { dimensions: string[]; measures: string[] }) {
        const { insightSpaces } = this;
        const { dimensions, measures, dataGraph } = this;
        // type1: meas cor assSpacesT1
        // type2: dims cor assSpacesT2
        // this.vie.dataGraph.DG
        const dimIndices = space.dimensions.map(f => dimensions.findIndex(d => f === d));
        const meaIndices = space.measures.map(f => measures.findIndex(m => f === m));
        const assSpacesT1: IVizSpace[] = [];
        const assSpacesT2: IVizSpace[] = [];
        for (let i = 0; i < insightSpaces.length; i++) {
            // if (i === spaceIndex) continue;
            if (space.dimensions.length > 0 && !intersect(insightSpaces[i].dimensions, space.dimensions)) continue;
            if (isSetEqual(insightSpaces[i].measures, space.measures)) continue;
            if (space.dimensions.length > 0 && !isSetEqual(insightSpaces[i].dimensions, space.dimensions)) continue;
            if (space.dimensions.length === 0 && !intersect(insightSpaces[i].measures, space.measures)) continue;
            if (space.dimensions.length === 0 && insightSpaces[i].dimensions.length !== 0) continue;
            let t1_score = 0;
            const iteMeaIndices = insightSpaces[i].measures.map(f => measures.findIndex(m => f === m));
            if (dataGraph !== null) {
                for (let j = 0; j < meaIndices.length; j++) {
                    for (let k = 0; k < iteMeaIndices.length; k++) {
                        t1_score += dataGraph.MG[meaIndices[j]][iteMeaIndices[k]]
                    }
                }
            }
            t1_score /= (meaIndices.length * iteMeaIndices.length)
            if (t1_score > 0.7) {
                const card = insightSpaces[i].dimensions.map(d => this.fields.find(f => f.key === d))
                .filter(f => f !== undefined)
                .map(f => Number(f?.features.unique))
                .reduce((t, v) => t * v, 1)
                const spec = await this.specification(insightSpaces[i])
                if (spec) {
                    // assSpacesT1.push({
                    //     schema: spec.schema,

                    // })
                    assSpacesT1.push({
                        ...insightSpaces[i],
                        score: t1_score / card / iteMeaIndices.length,
                        card,
                        // ...spec,
                        schema: spec.schema,
                        dataView: spec.dataView
                    })
                }
            }
        }
        for (let i = 0; i < insightSpaces.length; i++) {
            // if (i === spaceIndex) continue;
            if (!intersect(insightSpaces[i].measures, space.measures) && !intersect(insightSpaces[i].dimensions, space.dimensions)) continue;
            if (isSetEqual(insightSpaces[i].dimensions, space.dimensions)) continue;
            // if (!isSetEqual(insightSpaces[i].measures, space.measures)) continue;
            let t1_score = 0;
            const iteDimIndices = insightSpaces[i].dimensions.map(f => dimensions.findIndex(m => f === m));
            if (dataGraph !== null) {
                for (let j = 0; j < dimIndices.length; j++) {
                    for (let k = 0; k < iteDimIndices.length; k++) {
                        t1_score += dataGraph.DG[dimIndices[j]][iteDimIndices[k]]
                    }
                }
            }
            t1_score /= (dimIndices.length * iteDimIndices.length)
            if (t1_score > 0.15) { // (1 + 0.3) / 2
                const card = insightSpaces[i].dimensions.map(d => this.fields.find(f => f.key === d))
                .filter(f => f !== undefined)
                .map(f => Number(f?.features.unique))
                // .reduce((t, v) => t * v, 1)
                .reduce((t, v) => t + v, 0)
                const spec = await this.specification(insightSpaces[i])
                if (spec) {
                    assSpacesT2.push({
                        ...insightSpaces[i],
                        score: t1_score / card,
                        card,
                        ...spec
                    })
                }
            } else if (space.dimensions.length === 0) {
                // if (isSetEqual(insightSpaces[i].measures, space.measures)) {
                    const spec = await this.specification(insightSpaces[i])
                    const card = insightSpaces[i].dimensions.map(d => this.fields.find(f => f.key === d))
                        .filter(f => f !== undefined)
                        .map(f => Number(f?.features.unique))
                        .reduce((t, v) => t + v, 0);
                        if (spec) {
                            assSpacesT2.push({
                                ...insightSpaces[i],
                                score: t1_score / card,
                                card,
                                ...spec
                            })
                        }
                // }
            }
        }
        // assSpacesT1.sort((a, b) => (b.score || 0) / (b.impurity || 0) - (a.score || 0) / (a.impurity || 0))
        // assSpacesT2.sort((a, b) => (b.score || 0) / (b.impurity || 0) - (a.score || 0) / (a.impurity || 0))
        assSpacesT1.sort((a, b) => (b.score || 0) - (a.score || 0))
        assSpacesT2.sort((a, b) => (b.score || 0) - (a.score || 0))
        return {
            assSpacesT1,
            assSpacesT2
        }
    }
    public async exploreViews(viewSpaces: ViewSpace[] = this.subSpaces): Promise<IInsightSpace[]> {
        // console.log(JSON.stringify(this.dimensions), JSON.stringify(this.dataGraph.DG), JSON.stringify(this.dataGraph.DClusters), JSON.stringify(this.dataGraph.dimensions))
        // console.log(this.dataGraph.dimensions.map(d => this.fields.find(f => f.key === d)!.name))
        const context = this;
        const DEFAULT_BIN_NUM = 16;
        const { measures: globalMeasures, fieldDictonary, params } = context
        let ansSpace: IInsightSpace[] = [];
        if (context.cube === null) return ansSpace;
        const globalCuboid = await context.cube.getCuboid([]);
        const globalDist = await globalCuboid.getAggregatedRows(globalMeasures, globalMeasures.map(() => 'dist'));
        const pureMeasureViewMeasures: string[][] = [];
        for (let measures of context.dataGraph.MClusters) {
            if (measures.length > params.limit.measure) {
                pureMeasureViewMeasures.push(...getCombination(measures, params.limit.measure, params.limit.measure))
            } else {
                pureMeasureViewMeasures.push(measures)
            }
        }
        const meaUniqSet: Set<string> = new Set();
        const tmpAnsSpace: IInsightSpace[] = []
        for (let measures of pureMeasureViewMeasures) {
            // const ent = 
            let totalEntLoss = 0;
            for (let mea of measures) {
                let ent = 0;
                if (globalDist.length > 0) {
                    ent = entropyAcc(globalDist[0][mea].filter((d: number) => d > 0))
                }
                totalEntLoss += (Math.log2(DEFAULT_BIN_NUM) - ent) / Math.log2(DEFAULT_BIN_NUM)
            }
            totalEntLoss /= measures.length;
            
            tmpAnsSpace.push({
                dimensions: [],
                measures: measures,
                significance: 1,
                score: totalEntLoss,
                impurity: totalEntLoss
            })
        }
        tmpAnsSpace.sort((a, b) => Number(b.score) - Number(a.score));
        for (let space of tmpAnsSpace) {
            if (space.measures.every(m => meaUniqSet.has(m))) {
                continue;
            }
            for (let mea of space.measures) {
                meaUniqSet.add(mea);
            }
            ansSpace.push(space);
            if (meaUniqSet.size === context.measures.length) break;
        }
        let ii = 0;
        for (let space of viewSpaces) {
            ii++;
            // FIXME: throtte
            ii % 10 === 0 && setStateInStorage('explore_progress', ii / viewSpaces.length)
            const { dimensions, measures } = space;
            if (dimensions.length > params.limit.dimension || measures.length > params.limit.measure) {
                continue;
            }
            let dropSpace = false;
            const localCuboid = await context.cube.getCuboid(dimensions);
            await localCuboid.loadStateInCache();
            const localDist = await localCuboid.getAggregatedRows(measures, measures.map(() => 'dist'));
            localCuboid.clearState();
            let totalEntLoss = 0;
            for (let mea of measures) {
                let ent = 0;
                if (globalDist.length > 0) {
                    ent = entropyAcc(globalDist[0][mea].filter((d: number) => d > 0))
                }
                let conEnt = 0;
                // let tEnt = 0;
                if (!fieldDictonary.has(mea)) {
                    continue;
                }
                const totalCount = fieldDictonary.get(mea)!.features.size;
                const distList = localDist.map(r => ({
                    // TODO: [discuss] 讨论是否应当直接使用count
                    // Hao Chen, 9 months ago   (March 14th, 2022 7:03 PM) 
                    // props: 节省计算量
                    // cons: 强依赖于cube必须去计算count
                    freq: r[mea].reduce((total: number, value: number) => total + value, 0),
                    dist: r[mea]
                }))
                const useNestInfluence = false;
                // tEnt = entropy(distList.map(d => d.freq).filter(f => f > 0))
                distList.sort((a, b) => b.freq - a.freq);
                for (let i = 0; i < distList.length; i++) {
                    if (i >= DEFAULT_BIN_NUM - 1) break;
                    if (useNestInfluence && distList[i].freq < DEFAULT_BIN_NUM) {
                        conEnt += (distList[i].freq / totalCount) * ent
                    } else {
                        const subEnt1 = entropyAcc(distList[i].dist.filter((d: number) => d > 0));
                        conEnt += (distList[i].freq / totalCount) * subEnt1
                    }
                }
                const noiseGroup = new Array(DEFAULT_BIN_NUM).fill(0);
                let noiseFre = 0;
                for (let i = DEFAULT_BIN_NUM - 1; i < distList.length; i++) {
                    for (let j = 0; j < noiseGroup.length; j++) {
                        noiseGroup[j] += distList[i].dist[j];    
                    }
                    noiseFre += distList[i].freq;
                }
                if (noiseFre > 0) {
                    if (useNestInfluence && noiseFre < DEFAULT_BIN_NUM) {
                        conEnt += (noiseFre / totalCount) * ent;
                    } else {
                        conEnt += (noiseFre / totalCount) * entropyAcc(noiseGroup.filter(d => d > 0));
                    }
                }
                totalEntLoss += (ent - conEnt) / Math.log2(Math.min(DEFAULT_BIN_NUM, distList.length))
                // totalEntLoss += (ent - conEnt) / Math.log2(DEFAULT_BIN_NUM)
                // totalEntLoss += (ent - conEnt) / Math.min(DEFAULT_BIN_NUM, distList.length)
                if ((ent - conEnt) / ent < 0.005) {
                    dropSpace = true;
                    break;
                }
            }
            totalEntLoss /= measures.length;
            if (dropSpace) continue;
            ansSpace.push({
                dimensions,
                measures,
                significance: 1,
                score: totalEntLoss,
                impurity: totalEntLoss
            })
        }
        ansSpace.sort((a, b) => Number(b.score) - Number(a.score));
        return ansSpace;
    }
}