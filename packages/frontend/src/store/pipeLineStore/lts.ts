import { makeAutoObservable, observable, runInAction } from "mobx";
import { VIEngine } from "visual-insights/build/esm/insights";
import { IInsightSpace } from "visual-insights/build/esm/insights/InsightFlow/interfaces";
import { DataSourceStore } from "../dataSourceStore";

export class LTSPipeLine {
    private dataSourceStore: DataSourceStore;
    private vie: VIEngine;
    public insightSpaces: IInsightSpace[];
    constructor (dataSourceStore: DataSourceStore) {
        makeAutoObservable(this, {
            insightSpaces: observable.ref
        });
        this.dataSourceStore = dataSourceStore;
        const vie = new VIEngine();
        // vie.setDataSource(dataSourceStore.cleanedData)
        this.vie = vie;
        this.insightSpaces = [] as IInsightSpace[];
    }
    public async startTask () {
        const { cleanedData, dimensions, measures } = this.dataSourceStore;
        this.vie.setDataSource(cleanedData)
        .setFieldKeys([...dimensions, ...measures])
            .buildfieldsSummary()
            .setDimensions(dimensions)
            .setMeasures(measures)
        this.vie.buildGraph()
            .clusterFields()
            .buildCube()
            .buildSubspaces();
        await this.vie.insightExtraction();
        this.vie.setInsightScores();
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
}