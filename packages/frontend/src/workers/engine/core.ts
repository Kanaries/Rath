import { IInsightSpace, Insight } from 'visual-insights'
import { ViewSpace } from 'visual-insights/build/esm/insights/InsightFlow/engine';
import { KNNClusterWorker } from 'visual-insights/build/esm/insights/workers/KNNCluster';
import { IVizSpace } from '../../store/exploreStore';
import { isSetEqual } from '../../utils';
import { intersect } from './utils';

const VIEngine = Insight.VIEngine;

export class RathEngine extends VIEngine {
    public constructor() {
        super();
        this.workerCollection.register('clusters', KNNClusterWorker);
        this.workerCollection.enable('clusters', true);
        // vie.workerCollection.register('identity', identityWorker);
        // vie.workerCollection.enable(DefaultIWorker.outlier, false);
        // vie.workerCollection.enable(DefaultIWorker.trend, false);
    }
    public async createInsightSpaces(viewSpaces: ViewSpace[] = this.subSpaces): Promise<IInsightSpace[]> {
        const ansSpaces = await this.exploreViews(viewSpaces);
        this.insightSpaces = ansSpaces;
        return ansSpaces
    }
    public async scanDetail(viewSpace: ViewSpace) {
        const context = this;
        // @ts-ignore TODO: FIX this in visual insights
        const { cube, fieldDictonary } = context;
        const { dimensions, measures } = viewSpace;
        const cuboid = cube.getCuboid(viewSpace.dimensions);
        const aggData = cuboid.getState(measures, measures.map(() => 'sum'));
        const insightSpaces: IInsightSpace[] = []
        const taskPool: Promise<void>[] = [];
        this.workerCollection.each((iWorker, name) => {
            const task = async () => {
                const result = await iWorker(aggData, dimensions, measures, fieldDictonary, context);
                if (result) {
                    result.type = name;
                    insightSpaces.push(result)
                }
            }
            taskPool.push(task());
        })
        await Promise.all(taskPool);
        return insightSpaces
    }
    public async searchPointInterests(viewSpace: ViewSpace) {
        // const globalMeasures = this.measures;
        let ansSet: any[] = []
        if (viewSpace.dimensions.length > 0) {
            const cuboid = this.cube.getCuboid(viewSpace.dimensions);
            const globalDist = this.cube.getCuboid([]).getState(viewSpace.measures, viewSpace.measures.map(() => 'dist'));
            const localDist = cuboid.getState(viewSpace.measures, viewSpace.measures.map(() => 'dist'))
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
            
        //     for (let mea of viewSpace.measures) {
        //         const distList = localDist.map(r => ({
        //             // TODO: 讨论是否应当直接使用count
        //             // props: 节省计算量
        //             // cons: 强依赖于cube必须去计算count
        //             ...r,
        //             freq: r[mea].reduce((total: number, value: number) => total + value, 0),
        //             dist: r[mea]
        //         }))
        //         if (globalDist.length > 0) {
        //             const globalSum = globalDist[0][mea].reduce((total: number, value: number) => total + value, 0);
        //             const globalProbDist = globalDist[0][mea].map((v: number) => v / globalSum)
        //             for (let i = 0; i < distList.length; i++) {
        //                 let kl = 0;
        //                 for (let b = 0; b < distList[i].dist.length; b++) {
        //                     const px = distList[i].dist[b] / distList[i].freq
        //                     const py = globalProbDist[b];
        //                     if (px > 0 && py > 0) {
        //                         kl += px * Math.log2(px / py);
        //                     }
        //                 }
        //                 ansSet.push({
        //                     ...distList[i],
        //                     kl
        //                 })
        //             }
        //         }
        //     }
        } else {
            // todo
        }
        ansSet.sort((a, b) => b.kl - a.kl)
        return ansSet
    }
    public async associate(spaceIndex: number) {
        const { insightSpaces } = this;
        const space = insightSpaces[spaceIndex];
        const { dimensions, measures, dataGraph } = this;
        // type1: meas cor assSpacesT1
        // type2: dims cor assSpacesT2
        // this.vie.dataGraph.DG
        const dimIndices = space.dimensions.map(f => dimensions.findIndex(d => f === d));
        const meaIndices = space.measures.map(f => measures.findIndex(m => f === m));
        const assSpacesT1: IVizSpace[] = [];
        const assSpacesT2: IVizSpace[] = [];
        for (let i = 0; i < insightSpaces.length; i++) {
            if (i === spaceIndex) continue;
            if (!intersect(insightSpaces[i].dimensions, space.dimensions)) continue;
            if (isSetEqual(insightSpaces[i].measures, space.measures)) continue;
            if (!isSetEqual(insightSpaces[i].dimensions, space.dimensions)) continue;
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
                const spec = this.specification(insightSpaces[i])
                if (spec) {
                    // assSpacesT1.push({
                    //     schema: spec.schema,

                    // })
                    assSpacesT1.push({
                        ...insightSpaces[i],
                        score: t1_score,
                        // ...spec,
                        schema: spec.schema,
                        dataView: spec.dataView
                    })
                }
            }
        }
        for (let i = 0; i < insightSpaces.length; i++) {
            if (i === spaceIndex) continue;
            if (!intersect(insightSpaces[i].measures, space.measures)) continue;
            if (isSetEqual(insightSpaces[i].dimensions, space.dimensions)) continue;
            if (!isSetEqual(insightSpaces[i].measures, space.measures)) continue;
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
            if (t1_score > 0.65) { // (1 + 0.3) / 2
                const spec = this.specification(insightSpaces[i])
                if (spec) {
                    assSpacesT2.push({
                        ...insightSpaces[i],
                        score: t1_score,
                        ...spec
                    })
                }
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
}