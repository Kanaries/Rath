import { makeAutoObservable, observable, runInAction } from "mobx";
import { Specification } from "visual-insights";
import { IFieldSummary, IInsightSpace } from "visual-insights/build/esm/insights/InsightFlow/interfaces";
import { KNNClusterWorker } from 'visual-insights/build/esm/insights/workers/KNNCluster';
// import { simpleAggregate } from "visual-insights/build/esm/statistics";
import { IRow } from "../../interfaces";
import { IVizSpace } from "../../pages/lts/association/assCharts";
import { initRathWorker, rathEngineService } from "../../service";
import { RathEngine } from "../../workers/engine/core";
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


export class LTSPipeLine {
    private dataSourceStore: DataSourceStore;
    // private vie: RathEngine;
    // private vie: VIEngine;
    public insightSpaces: IInsightSpace[];
    public fields: IFieldSummary[] = [];
    public dataSource: IRow[] = [];
    public computing: boolean = false;
    constructor (dataSourceStore: DataSourceStore) {
        makeAutoObservable(this, {
            insightSpaces: observable.ref,
            fields: observable.ref,
            dataSource: observable.ref
        });
        this.dataSourceStore = dataSourceStore;

        this.insightSpaces = [] as IInsightSpace[];
        this.initEngine();
    }
    public async initEngine () {
        try {
            initRathWorker();
            const res = await rathEngineService({
                task: 'init'
            })
        } catch (error) {
            console.error(error)
        }
    }
    // public get in
    public async startTask () {
        const { cleanedData, fieldMetas } = this.dataSourceStore;
        this.computing = true;
        try {
            const res = await rathEngineService({
                task: 'start',
                props: {
                    dataSource: cleanedData,
                    fieldMetas
                }
            })
            PRINT_PERFORMANCE && console.log(res.performance)
            runInAction(() => {
                // this.vie.insightSpaces.sort((a, b) => Number(a.score) - Number(b.score));
                this.insightSpaces = res.insightSpaces;
                this.dataSource = res.dataSource;
                this.fields = res.fields;
                this.computing = false;
            })
        } catch (error) {
            console.error(error)
            runInAction(() => {
                // this.vie.insightSpaces.sort((a, b) => Number(a.score) - Number(b.score));
                this.insightSpaces = [];
                this.dataSource = []
                this.fields = [];
                this.computing = false;
            })
        }
        
        // const _insightSpaces = this.vie.insightSpaces.filter(s => typeof s.score === 'number' && !isNaN(s.score));
        // const insightSpaces: IInsightSpace[] = [];
        // let keyset = new Set();
        // _insightSpaces.sort((a, b) => Number(a.score) - Number(b.score));
        // for (let space of _insightSpaces) {
        //     const _key = space.dimensions.join('-') + '_' + space.measures.join('_');
        //     if (!keyset.has(_key)) {
        //         insightSpaces.push(space);
        //     }
        //     keyset.add(_key);
        // }
    }
    public async specify (spaceIndex: number): Promise<{ schema: Specification, dataView: IRow[] } | undefined> {
        if (spaceIndex < this.insightSpaces.length) {
            this.computing = true;
            try {
                const res = await rathEngineService({
                    task: 'specification',
                    props: spaceIndex
                })
                runInAction(() => {
                    this.computing = false;
                })
                return res;
            } catch (error) {
                console.error(error);
                runInAction(() => {
                    this.computing = false;
                })
                throw error;
            }
        }
    }
    public async scanDetails (spaceIndex: number): Promise<IInsightSpace[]> {
        const space = this.insightSpaces[spaceIndex];
        if (space) {
            this.computing = true;
            try {
                const res = await rathEngineService({
                    task: 'detail',
                    props: spaceIndex
                })
                runInAction(() => {
                    this.computing = false;
                })
                return res;
            } catch (error) {
                console.error(error)
                runInAction(() => {
                    this.computing = false;
                })
                throw error;
            }
        }
        return []
    }
    /**
     * currently provide view in insightSpaces only.
     * in future providing any view close to it (data or design)
     * adjust specify
     */
    public async getAssociatedViews (spaceIndex: number): Promise<{ assSpacesT1: IVizSpace[], assSpacesT2: IVizSpace[] }> {
        try {
            this.computing = true;
            const res = await rathEngineService({
                task: 'associate',
                props: spaceIndex
            })
            runInAction(() => {
                this.computing = false;
            })
            return res;
        } catch (error) {
            console.error(error)
            runInAction(() => {
                this.computing = false;
            })
            throw error;
        }
    }
}