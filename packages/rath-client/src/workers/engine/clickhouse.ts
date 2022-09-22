import { Computation, IDataViewMeta, IInsightSpace } from 'visual-insights';
import { IVizSpace } from '../../store/megaAutomation';
import { isSetEqual } from '../../utils';
import { intersect, setStateInStorage } from './utils';

export class RathCHEngine extends Computation.ClickHouseEngine {
    public async createInsightSpaces(dataViewMetas: IDataViewMeta[] = this.dataViewMetas): Promise<IInsightSpace[]> {
        return this.createInsightSpaces(dataViewMetas);
    }
    public async scanDetail() {
        return []
    }
    public async associate(space: { dimensions: string[]; measures: string[] }) {
        const { insightSpaces } = this;
        // const space = insightSpaces[spaceIndex];
        const { dimensions, measures, dataGraph } = this;
        // type1: meas cor assSpacesT1
        // type2: dims cor assSpacesT2
        // this.vie.dataGraph.DG
        const dimIndices = space.dimensions.map(f => dimensions.findIndex(d => f === d));
        const meaIndices = space.measures.map(f => measures.findIndex(m => f === m));
        const assSpacesT1: IVizSpace[] = [];
        const assSpacesT2: IVizSpace[] = [];
        for (let i = 0; i < insightSpaces.length; i++) {
            if (!intersect(insightSpaces[i].dimensions, space.dimensions)) continue;
            if (isSetEqual(insightSpaces[i].measures, space.measures)) continue;
            if (!isSetEqual(insightSpaces[i].dimensions, space.dimensions)) continue;
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
                // const spec = await specify(i);
                const spec = await this.specification(insightSpaces[i]);
                if (spec) {
                    assSpacesT1.push({
                        ...insightSpaces[i],
                        score: t1_score,
                        schema: spec.schema,
                        dataView: spec.dataView
                    })
                }
            }
        }
        for (let i = 0; i < insightSpaces.length; i++) {
            if (!intersect(insightSpaces[i].measures, space.measures)) continue;
            if (isSetEqual(insightSpaces[i].dimensions, space.dimensions)) continue;
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
                const spec = await this.specification(insightSpaces[i]);
                if (spec) {
                    assSpacesT1.push({
                        ...insightSpaces[i],
                        score: t1_score,
                        schema: spec.schema,
                        dataView: spec.dataView
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
    public async fastInsightRecommand(dataViewMetas: IDataViewMeta[] = this.dataViewMetas) {
        let ansSpace: IInsightSpace[] = [];
        let ii = 0;
        for (let viewMeta of dataViewMetas) {
            ii++;
            // FIXME: throtte
            ii % 10 === 0 && setStateInStorage('explore_progress', ii / dataViewMetas.length)
            ii % 10 === 0 && console.log(ii, dataViewMetas.length)
            const { dimensions, measures } = viewMeta;
            // @ts-ignore
            const imp = await this.getSpaceImpurity(this.dataViewName, dimensions, measures);
            ansSpace.push({
                dimensions,
                measures,
                impurity: imp,
                score: imp,
                significance: 1
            })
        }
        ansSpace.sort((a, b) => Number(a.score) - Number(b.score));
        this.insightSpaces = ansSpace;
        return ansSpace;
    }
}