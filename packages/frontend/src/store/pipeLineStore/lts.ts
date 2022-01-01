import { makeAutoObservable, observable, runInAction } from "mobx";
import { Sampling, Specification } from "visual-insights";
import { IFieldSummary, IInsightSpace } from "visual-insights/build/esm/insights/InsightFlow/interfaces";

import { IRow, ISyncEngine } from "../../interfaces";
import { IVizSpace } from "../../pages/lts/association/assCharts";
import { initRathWorker, rathEngineService } from "../../service";
import { IRathStorage } from "../../utils/storage";
import { ClickHouseStore } from "../clickhouseStore";
import { CommonStore } from "../commonStore";
import { DataSourceStore } from "../dataSourceStore";

const PRINT_PERFORMANCE = new URL(window.location.href).searchParams.get('performance');

export class LTSPipeLine {
    private dataSourceStore: DataSourceStore;
    private commonStore: CommonStore;
    private clickHouseStore: ClickHouseStore;
    // private vie: RathEngine;
    // private vie: VIEngine;
    public insightSpaces: IInsightSpace[];
    public fields: IFieldSummary[] = [];
    public dataSource: IRow[] = [];
    public samplingDataSource: IRow[] = [];
    public computing: boolean = false;
    constructor (dataSourceStore: DataSourceStore, commonStore: CommonStore, clickHouseStore: ClickHouseStore) {
        makeAutoObservable(this, {
            insightSpaces: observable.ref,
            fields: observable.ref,
            dataSource: observable.ref,
            samplingDataSource: observable.ref
        });
        this.dataSourceStore = dataSourceStore;
        this.commonStore = commonStore;
        this.clickHouseStore = clickHouseStore;

        this.insightSpaces = [] as IInsightSpace[];
        this.initEngine();
    }
    public async initEngine () {
        try {
            initRathWorker(this.commonStore.computationEngine);
            await rathEngineService({
                task: 'init',
                props: this.commonStore.computationEngine
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
                    mode: this.commonStore.computationEngine,
                    dataSource: cleanedData,
                    fieldMetas,
                    viewName: `${this.clickHouseStore.currentDB}.${this.clickHouseStore.currentView}`
                }
            })
            PRINT_PERFORMANCE && console.log(res.performance)
            runInAction(() => {
                // this.vie.insightSpaces.sort((a, b) => Number(a.score) - Number(b.score));
                this.insightSpaces = res.insightSpaces;
                this.dataSource = res.dataSource;
                this.fields = res.fields;
                this.computing = false;
                this.getSampleData()
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
    public async getSampleData(maxSampleSize: number = 500) {
        this.samplingDataSource = Sampling.reservoirSampling(this.dataSource, maxSampleSize);
    }
    public async specify (space: IInsightSpace): Promise<{ schema: Specification, dataView: IRow[] } | undefined> {
        if (space) {
            this.computing = true;
            try {
                const res = await rathEngineService({
                    task: 'specification',
                    props: space
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
    public async getAssociatedViews (dimensions: string[], measures: string[]): Promise<{ assSpacesT1: IVizSpace[], assSpacesT2: IVizSpace[] }> {
        try {
            this.computing = true;
            const res = await rathEngineService({
                task: 'associate',
                props: {
                    dimensions, measures
                }
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
    public async syncStateFromEngine () {
        try {
            const engineState: ISyncEngine = await rathEngineService({
                task: 'sync'
            })
            runInAction(() => {
                this.dataSource = engineState.dataSource
                this.fields = engineState.fields
                this.insightSpaces = engineState.insightSpaces
            })
        } catch (error) {
            throw error;
        }
    }
    public async downloadResults (): Promise<Pick<IRathStorage, 'engineStorage' | 'dataStorage'>> {
        try {
            this.computing = true;
            const res = await rathEngineService({
                task: 'download'
            })
            runInAction(() => {
                this.computing = false;
            })
            return res
        } catch (error) {
            runInAction(() => {
                this.computing = false;
            })
            throw error
        }
    }
    public exportDataStore () {
        return this.dataSourceStore.exportStore();
    }
    public async importFromUploads (props: Pick<IRathStorage, 'engineStorage' | 'dataStorage'>) {
        try {
            this.computing = true;
            await rathEngineService({
                task: 'upload',
                props
            })
            runInAction(() => {
                this.computing = false;
            })
            this.syncStateFromEngine();
        } catch (error) {
            runInAction(() => {
                this.computing = false;
            })
            throw error;
        }
    }
}