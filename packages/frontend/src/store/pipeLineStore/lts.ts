import { makeAutoObservable, observable, runInAction } from "mobx";
// import { InsightWorker } from "visual-insights/build/esm/commonTypes";
import { DefaultIWorker, VIEngine } from "visual-insights/build/esm/insights";
import { ViewSpace } from "visual-insights/build/esm/insights/dev";
import { IFieldSummary, IInsightSpace } from "visual-insights/build/esm/insights/InsightFlow/interfaces";
import { KNNClusterWorker } from 'visual-insights/build/esm/insights/workers/KNNCluster';
// import { simpleAggregate } from "visual-insights/build/esm/statistics";
import { IRow } from "../../interfaces";
import { IVizSpace } from "../../pages/lts/association/assCharts";
import { DataSourceStore } from "../dataSourceStore";

// const identityWorker: InsightWorker = async (aggData, dimensions, measures) => {
//     return {
//         dimensions,
//         measures,
//         significance: 1
//     }
// }

function intersect (A: string[], B: string[]) {
    const bset = new Set(B);
    for (let a of A) {
        if (bset.has(a)) return true
    }
    return false;
}

const PRINT_PERFORMANCE = new URL(window.location.href).searchParams.get('performance');

class TestEngine extends VIEngine {
    public async insightExtraction(viewSpaces: ViewSpace[] = this.subSpaces): Promise<IInsightSpace[]> {
        const context = this;
        let ansSpace: IInsightSpace[] = [];
        for (let space of viewSpaces) {
            const { dimensions, measures } = space;

            let cube = context.cube;
            let cuboid = cube.getCuboid(dimensions);
            const aggData = cuboid.getState(measures, measures.map(() => 'sum'));

            const imp = VIEngine.getSpaceImpurity(aggData, dimensions, measures);
            ansSpace.push({
                impurity: imp,
                significance: 1,
                dimensions,
                measures
            })
        }
        context.insightSpaces = ansSpace;
        return ansSpace;
    }
    public async scanDetail (viewSpace: ViewSpace) {
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
}
export class LTSPipeLine {
    private dataSourceStore: DataSourceStore;
    private vie: TestEngine;
    // private vie: VIEngine;
    public insightSpaces: IInsightSpace[];
    public fields: IFieldSummary[] = [];
    public dataSource: IRow[] = [];
    constructor (dataSourceStore: DataSourceStore) {
        makeAutoObservable(this, {
            insightSpaces: observable.ref,
            fields: observable.ref,
            dataSource: observable.ref
        });
        this.dataSourceStore = dataSourceStore;
        const vie = new TestEngine();
        // const vie = new VIEngine();
        vie.workerCollection.register('clusters', KNNClusterWorker);
        vie.workerCollection.enable('clusters', true);
        // vie.workerCollection.register('identity', identityWorker);
        // vie.workerCollection.enable(DefaultIWorker.outlier, false);
        // vie.workerCollection.enable(DefaultIWorker.trend, false);
        // vie.setDataSource(dataSourceStore.cleanedData)
        this.vie = vie;
        this.insightSpaces = [] as IInsightSpace[];
    }
    // public get in
    public async startTask () {
        const { cleanedData, fieldMetas } = this.dataSourceStore;
        const times: number[] = [];
        const prints: IRow[] = [];
        times.push(performance.now())
        const fieldsProps = fieldMetas.map(f => ({ key: f.fid, semanticType: f.semanticType, analyticType: f.analyticType, dataType: '?' as '?' }));
        console.log(fieldsProps, cleanedData)
        this.vie.setData(cleanedData)
            .setFields(fieldsProps)
        this.vie.univarSelection();
        console.log(this.vie.dimensions, this.vie.measures)
        // this.vie.setDataSource(cleanedData)
        // .setFieldKeys([...dimensions, ...measures])
        //     .buildfieldsSummary()
        //     .setDimensions(dimensions)
        //     .setMeasures(measures)
        times.push(performance.now())
        prints.push({ task: 'init&univar', value: times[times.length - 1] - times[times.length - 2] })
        this.vie.buildGraph();
        times.push(performance.now())
        prints.push({ task: 'co-graph', value: times[times.length - 1] - times[times.length - 2] })
        this.vie.clusterFields();
        times.push(performance.now())
        prints.push({ task: 'clusters', value: times[times.length - 1] - times[times.length - 2] })
        this.vie.buildCube();
        times.push(performance.now())
        prints.push({ task: 'cube', value: times[times.length - 1] - times[times.length - 2] })
        this.vie.buildSubspaces();
        times.push(performance.now())
        prints.push({ task: 'subspaces', value: times[times.length - 1] - times[times.length - 2] })
        await this.vie.insightExtraction();
        times.push(performance.now())
        prints.push({ task: 'insights', value: times[times.length - 1] - times[times.length - 2] })
        this.vie.setInsightScores();
        times.push(performance.now())
        prints.push({ task: 'scores', value: times[times.length - 1] - times[times.length - 2] })
        PRINT_PERFORMANCE && console.log(JSON.stringify(prints, null, 2))
        // console.log(JSON.stringify(prints, null, 2))
        const _insightSpaces = this.vie.insightSpaces.filter(s => typeof s.score === 'number' && !isNaN(s.score));
        const insightSpaces: IInsightSpace[] = [];
        let keyset = new Set();
        _insightSpaces.sort((a, b) => Number(a.score) - Number(b.score));
        for (let space of _insightSpaces) {
            const _key = space.dimensions.join('-') + '_' + space.measures.join('_');
            if (!keyset.has(_key)) {
                insightSpaces.push(space);
            }
            keyset.add(_key);
        }
        runInAction(() => {
            // this.vie.insightSpaces.sort((a, b) => Number(a.score) - Number(b.score));
            this.insightSpaces = insightSpaces;
            this.dataSource = this.vie.dataSource;
            this.fields = this.vie.fields;
        })
    }
    public specify (spaceIndex: number) {
        if (this.vie.insightSpaces && spaceIndex < this.insightSpaces.length) {
            return this.vie.specification(this.insightSpaces[spaceIndex])
        }
    }
    public async scanDetails (spaceIndex: number): Promise<IInsightSpace[]> {
        const space = this.insightSpaces[spaceIndex];
        if (space) {
            return this.vie.scanDetail(space);
        }
        return []
    }
    /**
     * currently provide view in insightSpaces only.
     * in future providing any view close to it (data or design)
     * adjust specify
     */
    public getAssociatedViews (spaceIndex: number) {
        const { insightSpaces } = this;
        const space = insightSpaces[spaceIndex];
        const { dimensions, measures, dataGraph } = this.vie;
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
            for (let j = 0; j < meaIndices.length; j++) {
                for (let k = 0; k < iteMeaIndices.length; k++) {
                    t1_score += dataGraph.MG[j][k]
                }
            }
            t1_score /= (meaIndices.length * iteMeaIndices.length)
            if (t1_score > 0.7) {
                const spec = this.specify(i);
                if (spec) {
                    assSpacesT1.push({
                        ...insightSpaces[i],
                        score: t1_score,
                        ...spec
                    })
                }
            }
        }
        for (let i = 0; i < insightSpaces.length; i++) {
            if (i === spaceIndex) continue;
            if (!intersect(insightSpaces[i].measures, space.measures)) continue;
            let t1_score = 0;
            const iteDimIndices = insightSpaces[i].dimensions.map(f => dimensions.findIndex(m => f === m));
            for (let j = 0; j < dimIndices.length; j++) {
                for (let k = 0; k < iteDimIndices.length; k++) {
                    t1_score += dataGraph.DG[j][k]
                }
            }
            t1_score /= (dimIndices.length * iteDimIndices.length)
            if (t1_score > 0.5) {
                const spec = this.specify(i);
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