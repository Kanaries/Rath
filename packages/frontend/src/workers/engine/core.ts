import { IInsightSpace, Insight } from 'visual-insights'
import { ViewSpace } from 'visual-insights/build/esm/insights/InsightFlow/engine';
import { KNNClusterWorker } from 'visual-insights/build/esm/insights/workers/KNNCluster';
import { IRow } from '../../interfaces';
import { IVizSpace } from '../../store/exploreStore';
import { intersect } from './utils';

const VIEngine = Insight.VIEngine;

const BIN_SIZE = 8;

function entropyAcc (fl: number[]) {
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
function meaImp (dataSource: IRow[], mea: string, minValue: number, maxValue: number): number {
    // const _min = typeof minValue !== 'undefined' ? minValue : Math.min(...dataSource.map(d => d[mea]));
    // const _max = typeof maxValue !== 'undefined' ? maxValue : Math.max(...dataSource.map(d => d[mea]));
    const _min = minValue;
    const _max = maxValue;
    const step = (_max - _min) / BIN_SIZE;
    let dist = new Array(BIN_SIZE + 1).fill(0);
    for (let record of dataSource) {
        let vIndex = Math.floor((record[mea] - _min) / step);
        dist[vIndex]++;
    }
    dist[BIN_SIZE - 1] += dist[BIN_SIZE];
    // const pl = normalize(dist.filter(d => d > 0));
    const ent = entropyAcc(dist.slice(0, BIN_SIZE).filter(d => d > 0));
    return ent;
}
function viewImp (dataSource: IRow[], dimensions: string[], measures: string[]): number {
    const groups: Map<string, IRow[]> = new Map();
    for (let record of dataSource) {
        const _key = dimensions.map(d => record[d]).join('_');
        if (!groups.has(_key)) {
            groups.set(_key, [])
        }
        groups.get(_key)?.push(record);
    }
    let totalEntLoss = 0;
    for (let mea of measures) {
        const _min = Math.min(...dataSource.map(d => d[mea]));
        const _max = Math.max(...dataSource.map(d => d[mea]));;
        const ent = meaImp(dataSource, mea, _min, _max);
        // conditional ent
        
        let condEnt = 0;
        let logs = [];
        const entries = [...groups.entries()];

        entries.sort((a, b) => b[1].length - a[1].length);

        for (let i = 0; i < entries.length; i++) {
            const groupRows = entries[i][1];
            let groupProb = groupRows.length / dataSource.length;
            const subEnt = meaImp(groupRows, mea, _min, _max);
            condEnt += groupProb * subEnt;
            logs.push([groupProb, subEnt])
        }
        let noiseGroup: IRow[] = [];
        for (let i = BIN_SIZE - 1; i < entries.length; i++) {
            noiseGroup.push(...entries[i][1]);
        }
        if (noiseGroup.length > 0) {
            let groupProb = noiseGroup.length / dataSource.length;
            const subEnt = meaImp(noiseGroup, mea, _min, _max);
            condEnt += groupProb * subEnt;
        }

        // for (let [groupKey, groupRows] of groups.entries()) {
        //     let groupProb = groupRows.length / dataSource.length;
        //     const subEnt = meaImp(groupRows, mea, _min, _max);
        //     condEnt += groupProb * subEnt;
        //     logs.push([groupProb, subEnt])
        // }
        // console.log(logs)
        // console.log('H(X), H(X|Y)]]]]]]', ent, condEnt)
        totalEntLoss += noiseGroup.length > 0 ? (ent - condEnt) / Math.log2(BIN_SIZE) : (ent - condEnt) / Math.log2(groups.size);

    }
    // const groupFL: number[] = [];
    // for (let rows of groups.values()) {
    //     groupFL.push(rows.length);
    // }

    // totalEntLoss = totalEntLoss / Math.log2(groups.size)//groups.size;
    // console.log({ dimensions, measures, score: totalEntLoss / measures.length, totalEntLoss })
    return totalEntLoss / measures.length;
}
export class RathEngine extends VIEngine {
    public constructor() {
        super();
        this.workerCollection.register('clusters', KNNClusterWorker);
        this.workerCollection.enable('clusters', true);
        // vie.workerCollection.register('identity', identityWorker);
        // vie.workerCollection.enable(DefaultIWorker.outlier, false);
        // vie.workerCollection.enable(DefaultIWorker.trend, false);
    }
    public createInsightSpaces(viewSpaces: ViewSpace[] = this.subSpaces): IInsightSpace[] {
        const context = this;
        let ansSpace: IInsightSpace[] = [];
        for (let space of viewSpaces) {
            const { dimensions, measures } = space;

            // let cube = context.cube;
            // let cuboid = cube.getCuboid(dimensions);
            // const aggData = cuboid.getState(measures, measures.map(() => 'sum'));

            // const imp = VIEngine.getSpaceImpurity(aggData, dimensions, measures);
            const imp = viewImp(context.dataSource, dimensions, measures);
            ansSpace.push({
                impurity: imp,
                significance: 1,
                dimensions,
                measures
            })
        }
        // ansSpace.sort((a, b) => (a.impurity || 0) - (b.impurity || 0));
        context.insightSpaces = ansSpace;
        return ansSpace;
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
            let t1_score = 0;
            const iteMeaIndices = insightSpaces[i].measures.map(f => measures.findIndex(m => f === m));
            if (dataGraph !== null) {
                for (let j = 0; j < meaIndices.length; j++) {
                    for (let k = 0; k < iteMeaIndices.length; k++) {
                        t1_score += dataGraph.MG[j][k]
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
            // if (!isSetEqual(insightSpaces[i].measures, space.measures)) continue;
            let t1_score = 0;
            const iteDimIndices = insightSpaces[i].dimensions.map(f => dimensions.findIndex(m => f === m));
            if (dataGraph !== null) {
                for (let j = 0; j < dimIndices.length; j++) {
                    for (let k = 0; k < iteDimIndices.length; k++) {
                        t1_score += dataGraph.DG[j][k]
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
        assSpacesT1.sort((a, b) => (b.score || 0) - (a.score || 0))
        assSpacesT2.sort((a, b) => (b.score || 0) - (a.score || 0))
        return {
            assSpacesT1,
            assSpacesT2
        }
    }
}