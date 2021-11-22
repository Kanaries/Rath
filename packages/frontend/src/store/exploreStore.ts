import { makeAutoObservable, observable, runInAction } from 'mobx';
import { Specification } from 'visual-insights';
import { IInsightSpace } from 'visual-insights/build/esm/insights/InsightFlow/interfaces';
import { ISpec } from 'visual-insights/build/esm/insights/InsightFlow/specification/encoding';
import { RESULT_STORAGE_SPLITOR, STORAGE_FILE_SUFFIX } from '../constants';
import { IRow, PreferencePanelConfig } from '../interfaces';
// import { rathEngineService } from '../service';
import { isSetEqual } from '../utils';
import { LTSPipeLine } from './pipeLineStore/lts';


export interface IVizSpace extends IInsightSpace {
    schema: Specification;
    dataView: IRow[]
}

export class ExploreStore {
    public pageIndex: number = 0;
    private ltsPipeLineStore: LTSPipeLine;
    public spec: { schema: ISpec; dataView: IRow[] } | undefined = undefined;
    public specForGraphicWalker: ISpec | undefined = undefined;
    public details: IInsightSpace[] = [];
    public assoListT1: IVizSpace[] = []
    public assoListT2: IVizSpace[] = []
    public showAsso: boolean = false;
    public showPreferencePannel: boolean = false;
    public visualConfig: PreferencePanelConfig;
    // public viewData: IRow[] = []
    constructor (ltsPipeLineStore: LTSPipeLine) {
        this.visualConfig = {
            aggregator: "sum",
            defaultAggregated: true,
            defaultStack: true,
        };
        makeAutoObservable(this, {
            spec: observable.ref,
            specForGraphicWalker: observable.ref,
            details: observable.ref,
            assoListT1: observable.ref,
            assoListT2: observable.ref,
            // viewData: observable.ref
        });
        this.ltsPipeLineStore = ltsPipeLineStore;
    }
    public get insightSpaces () {
        return this.ltsPipeLineStore.insightSpaces
    }
    public get fields () {
        return this.ltsPipeLineStore.fields;
    }
    public get dataSource () {
        return this.ltsPipeLineStore.dataSource
    }
    public setVisualConig (updater: (config: PreferencePanelConfig) => void) {
        runInAction(() => {
            updater(this.visualConfig)
        });
    }
    public jumpToView (viz: IVizSpace) {
        const { insightSpaces } = this;
        const { dimensions, measures } = viz;
        for (let i = 0; i < insightSpaces.length; i++) {
            if (isSetEqual(dimensions, insightSpaces[i].dimensions) && isSetEqual(measures, insightSpaces[i].measures)) {
                this.emitViewChangeTransaction(i);
                break;
            }
        }
    }
    public setShowPreferencePannel(show: boolean) {
        this.showPreferencePannel = show;
    }
    // public async getViewData (dimensions: string[], measures: string[]) {
    //     try {
    //         const data = await rathEngineService({
    //             task: 'cube',
    //             props: {
    //                 dimensions,
    //                 measures,
    //                 aggregators: measures.map(m => 'sum')
    //             }
    //         })
    //         return data;
    //     } catch (error) {
    //         return []
    //     }
    // }
    public async goToLastView () {
        const { pageIndex, insightSpaces } = this;
        this.emitViewChangeTransaction((pageIndex - 1 + insightSpaces.length) % insightSpaces.length)
    }
    public async goToNextView () {
        const { pageIndex, insightSpaces } = this;
        this.emitViewChangeTransaction((pageIndex + 1) % insightSpaces.length)
    }
    public async emitViewChangeTransaction(index: number) {
        // pipleLineStore统一提供校验逻辑
        if (this.ltsPipeLineStore.insightSpaces && this.ltsPipeLineStore.insightSpaces.length > index) {
            const iSpace = this.ltsPipeLineStore.insightSpaces[index];
            const spec = await this.ltsPipeLineStore.specify(index);
            // const viewData = await this.getViewData(iSpace.dimensions, iSpace.measures);
            if (spec) {
                // this.spec = spec;
                const agg = !spec.schema.geomType?.includes('point');
                runInAction(() => {
                    this.spec = spec;
                    // this.viewData = viewData;
                    this.visualConfig.defaultAggregated = agg;
                    this.pageIndex = index;
                    this.details = []
                    this.showAsso = false;
                    this.assoListT1 = [];
                    this.assoListT2 = []
                })
            }
        }
    }
    public setAggState (aggState: boolean) {
        this.visualConfig.defaultAggregated = aggState;
    }
    public async scanDetails (spaceIndex: number) {
        const result = await this.ltsPipeLineStore.scanDetails(spaceIndex);
        runInAction(() => {
            this.details = result;
        })
    }
    public async downloadResults () {
        // TODO: 序列化相关工程问题
        // 1. 下载与上传的处理逻辑尽量放在同一文件处理（待议）
        // 2. 要提供同一的parser处理，编解码逻辑可以集中管理并维护。目前这部分逻辑过分散乱。
        const pipeContent = await this.ltsPipeLineStore.downloadResults();
        const dataContent = JSON.stringify(this.ltsPipeLineStore.exportDataStore());
        const ele = document.createElement('a');
        ele.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(dataContent + RESULT_STORAGE_SPLITOR + pipeContent));
        ele.setAttribute('download', `Rath_Analysis_Notebook.${STORAGE_FILE_SUFFIX}`)
        ele.style.display = 'none'
        document.body.appendChild(ele)
        ele.click();

        document.body.removeChild(ele);
    }
    public async getAssociatedViews () {
        const asso = await this.ltsPipeLineStore.getAssociatedViews(this.pageIndex);
        runInAction(() => {
            this.assoListT1 = asso.assSpacesT1;
            this.assoListT2 = asso.assSpacesT2;
            this.showAsso = true;
        })
    }
    public bringToGrphicWalker () {
        if (this.spec && this.spec.schema) {
            this.specForGraphicWalker = this.spec.schema;
        }
    }
}
