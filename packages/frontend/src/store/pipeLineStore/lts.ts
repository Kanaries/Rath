import { makeAutoObservable, observable, runInAction } from "mobx";
// import { InsightWorker } from "visual-insights/build/esm/commonTypes";
import { DefaultIWorker, VIEngine } from "visual-insights/build/esm/insights";
import { ViewSpace } from "visual-insights/build/esm/insights/dev";
import { IInsightSpace } from "visual-insights/build/esm/insights/InsightFlow/interfaces";
import { KNNClusterWorker } from 'visual-insights/build/esm/insights/workers/KNNCluster';
// import { simpleAggregate } from "visual-insights/build/esm/statistics";
import { IRow } from "../../interfaces";
import { DataSourceStore } from "../dataSourceStore";

// const identityWorker: InsightWorker = async (aggData, dimensions, measures) => {
//     return {
//         dimensions,
//         measures,
//         significance: 1
//     }
// }

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
    constructor (dataSourceStore: DataSourceStore) {
        makeAutoObservable(this, {
            insightSpaces: observable.ref
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
    public async startTask () {
        const { cleanedData, dimensions, measures } = this.dataSourceStore;
        // const times: number[] = [];
        // const prints: IRow[] = [];
        // times.push(performance.now())
        this.vie.setDataSource(cleanedData)
        .setFieldKeys([...dimensions, ...measures])
            .buildfieldsSummary()
            .setDimensions(dimensions)
            .setMeasures(measures)
        // times.push(performance.now())
        // prints.push({ task: 'init&univar', value: times[times.length - 1] - times[times.length - 2] })
        this.vie.buildGraph();
        // times.push(performance.now())
        // prints.push({ task: 'co-graph', value: times[times.length - 1] - times[times.length - 2] })
        this.vie.clusterFields();
        // times.push(performance.now())
        // prints.push({ task: 'clusters', value: times[times.length - 1] - times[times.length - 2] })
        this.vie.buildCube();
        // times.push(performance.now())
        // prints.push({ task: 'cube', value: times[times.length - 1] - times[times.length - 2] })
        this.vie.buildSubspaces();
        // times.push(performance.now())
        // prints.push({ task: 'subspaces', value: times[times.length - 1] - times[times.length - 2] })
        await this.vie.insightExtraction();
        // times.push(performance.now())
        // prints.push({ task: 'insights', value: times[times.length - 1] - times[times.length - 2] })
        this.vie.setInsightScores();
        // times.push(performance.now())
        // prints.push({ task: 'scores', value: times[times.length - 1] - times[times.length - 2] })
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
}