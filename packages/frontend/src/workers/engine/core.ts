import { IInsightSpace, Insight } from 'visual-insights'
import { ViewSpace } from 'visual-insights/build/esm/insights/InsightFlow/engine';
import { KNNClusterWorker } from 'visual-insights/build/esm/insights/workers/KNNCluster';

const VIEngine = Insight.VIEngine;

export class RathEngine extends VIEngine {
    public constructor () {
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