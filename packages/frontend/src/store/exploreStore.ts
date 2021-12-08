import { makeAutoObservable, observable, runInAction, toJS } from 'mobx';
import { Specification, IInsightSpace } from 'visual-insights';
import { ISpec } from 'visual-insights/build/esm/insights/InsightFlow/specification/encoding';
import { STORAGE_FILE_SUFFIX } from '../constants';
import { Aggregator } from '../global';
import { IRow, PreferencePanelConfig } from '../interfaces';
import { rathEngineService } from '../service';
import { isSetEqual } from '../utils';
import { RathStorageDump } from '../utils/storage';
import { LTSPipeLine } from './pipeLineStore/lts';

export interface IVizSpace extends IInsightSpace {
    schema: Specification;
    dataView: IRow[]
}

interface IExploreView {
    dimensions: string[];
    measures: string[];
    ops: Aggregator[]
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
    public showConstraints: boolean = false;
    public showPreferencePannel: boolean = false;
    public showSaveModal: boolean = false;
    public visualConfig: PreferencePanelConfig;
    public forkView: IExploreView | null = null;
    public view: IExploreView | null = null;
    public forkViewSpec: {
        schema: Specification;
        dataView: IRow[];
    } | null = null;
    public globalConstraints: {
        dimensions: Array<{fid: string; state: number}>;
        measures: Array<{fid: string; state: number}>
    }
    // public viewData: IRow[] = []
    constructor (ltsPipeLineStore: LTSPipeLine) {
        this.visualConfig = {
            aggregator: "sum",
            defaultAggregated: false,
            defaultStack: true,
            visMode: 'dist'
        };
        this.globalConstraints = {
            dimensions: [],
            measures: []
        }
        makeAutoObservable(this, {
            spec: observable.ref,
            specForGraphicWalker: observable.ref,
            details: observable.ref,
            assoListT1: observable.ref,
            assoListT2: observable.ref,
            forkViewSpec: observable.ref,
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
    public async specifyForkView () {
        if (this.forkView !== null) {
            const spec = await this.ltsPipeLineStore.specify({
                dimensions: toJS(this.forkView.dimensions),
                measures: toJS(this.forkView.measures),
                significance: 1
            })
            if (spec) {
                runInAction(() => {
                    this.forkViewSpec = spec
                })
            }
        }
    }
    public initConstraints () {
        const fields = this.ltsPipeLineStore.fields;
        this.globalConstraints.dimensions = fields.filter(f => f.analyticType === 'dimension')
            .map(f => ({
                fid: f.key,
                state: 0
            }));
        this.globalConstraints.measures = fields.filter(f => f.analyticType === 'measure')
            .map(f => ({
                fid: f.key,
                state: 0
            }));
    }
    public updateConstraints (ckey: 'dimensions' | 'measures', index: number) {
        if (index < this.globalConstraints[ckey].length) {
            this.globalConstraints[ckey][index].state = (this.globalConstraints[ckey][index].state + 1 + 1) % 3 - 1
        }
    }
    public async getViewData (dimensions: string[], measures: string[], ops: string[]) {
        try {
            const data = await rathEngineService({
                task: 'cube',
                props: {
                    dimensions,
                    measures,
                    aggregators: ops
                }
            })
            return data;
        } catch (error) {
            return []
        }
    }
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
            const spec = await this.ltsPipeLineStore.specify(iSpace);
            // const viewData = await this.getViewData(iSpace.dimensions, iSpace.measures);
            if (spec) {
                // default aggregate 推断逻辑，旧时，推荐为业务图表时使用。
                // const agg = !spec.schema.geomType?.includes('point');
                runInAction(() => {
                    this.spec = spec;
                    // this.viewData = viewData;
                    // this.visualConfig.defaultAggregated = agg;
                    this.pageIndex = index;
                    this.details = []
                    this.showAsso = false;
                    this.assoListT1 = [];
                    this.assoListT2 = []
                    // 这里不是啰嗦的写法！！forView 和 view 独立，不要直接赋值了，浅拷贝也不行。
                    this.forkView = { dimensions: iSpace.dimensions, measures: iSpace.measures, ops: iSpace.measures.map(() => 'sum')}
                    this.view = { dimensions: iSpace.dimensions, measures: iSpace.measures, ops: iSpace.measures.map(() => 'sum')}
                })
            }
        }
    }
    public setAggState (aggState: boolean) {
        this.visualConfig.defaultAggregated = aggState;
    }
    public setShowAsso (show: boolean) {
        this.showAsso = show;
    }
    public setShowContraints (show: boolean) {
        this.showConstraints = show;
    }
    public setShowSaveModal (show: boolean) {
        this.showSaveModal = show;
    }
    public async addFieldToForkView(analyticType: 'dimensions' | 'measures', fid: string) {
        if (this.forkView !== null) {
            if (!this.forkView[analyticType].includes(fid)) {
                // 未来可以支持有重复字段的可视化视图
                this.forkView[analyticType].push(fid);
                this.specifyForkView();
            }
        }
    }
    public async removeFieldFromForkView(analyticType: 'dimensions' | 'measures', fid: string) {
        if (this.forkView !== null) {
            const index = this.forkView[analyticType].findIndex(f => f === fid);
            if (index !== -1) {
                this.forkView[analyticType].splice(index, 1)
            }
            this.specifyForkView();
        }
    }
    public async scanDetails (spaceIndex: number) {
        const result = await this.ltsPipeLineStore.scanDetails(spaceIndex);
        runInAction(() => {
            this.details = result;
        })
    }
    public async getStorageContent (): Promise<string> {
        // TODO: 序列化相关工程问题
        // 1. 下载与上传的处理逻辑尽量放在同一文件处理（待议）
        // 2. 要提供同一的parser处理，编解码逻辑可以集中管理并维护。目前这部分逻辑过分散乱。
        const pipeContent = await this.ltsPipeLineStore.downloadResults();
        const dataContent = JSON.stringify(this.ltsPipeLineStore.exportDataStore());
        return RathStorageDump({
            ...pipeContent,
            appStorage: dataContent
        })
    }
    public async downloadResults () {
        const content = await this.getStorageContent();
        const ele = document.createElement('a');
        ele.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
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
