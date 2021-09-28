import { makeAutoObservable, observable, runInAction } from 'mobx';
import { Specification } from 'visual-insights';
import { IInsightSpace } from 'visual-insights/build/esm/insights/InsightFlow/interfaces';
import { ISpec } from 'visual-insights/build/esm/insights/InsightFlow/specification/encoding';
import { IRow, PreferencePanelConfig } from '../interfaces';
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
    public details: IInsightSpace[] = [];
    public assoListT1: IVizSpace[] = []
    public assoListT2: IVizSpace[] = []
    public showAsso: boolean = false;
    public showPreferencePannel: boolean = false;
    public visualConfig: PreferencePanelConfig;
    constructor (ltsPipeLineStore: LTSPipeLine) {
        this.visualConfig = {
            aggregator: "sum",
            defaultAggregated: true,
            defaultStack: true,
        };
        makeAutoObservable(this, {
            spec: observable.ref,
            details: observable.ref,
            assoListT1: observable.ref,
            assoListT2: observable.ref
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
            const spec = await this.ltsPipeLineStore.specify(index);
            if (spec) {
                // this.spec = spec;
                const agg = !spec.schema.geomType?.includes('point');
                runInAction(() => {
                    this.spec = spec;
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
    public async getAssociatedViews () {
        console.log('get')
        const asso = await this.ltsPipeLineStore.getAssociatedViews(this.pageIndex);
        runInAction(() => {
            this.assoListT1 = asso.assSpacesT1;
            this.assoListT2 = asso.assSpacesT2;
            this.showAsso = true;
        })
        // console.log(this.assoList)
    }
}
