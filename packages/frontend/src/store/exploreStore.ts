import { makeAutoObservable, observable, runInAction } from 'mobx';
import { Specification } from 'visual-insights';
import { IInsightSpace } from 'visual-insights/build/esm/insights/InsightFlow/interfaces';
import { ISpec } from 'visual-insights/build/esm/insights/InsightFlow/specification/encoding';
import { IRow } from '../interfaces';
import { LTSPipeLine } from './pipeLineStore/lts';


export interface IVizSpace extends IInsightSpace {
    schema: Specification;
    dataView: IRow[]
}

export class ExploreStore {
    public pageIndex: number = 0;
    public aggState: boolean = false;
    private ltsPipeLineStore: LTSPipeLine;
    public spec: { schema: ISpec; dataView: IRow[] } | undefined = undefined;
    public details: IInsightSpace[] = [];
    public assoListT1: IVizSpace[] = []
    public assoListT2: IVizSpace[] = []
    public showAsso: boolean = false;
    constructor (ltsPipeLineStore: LTSPipeLine) {
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
    public async emitViewChangeTransaction(index: number) {
        // pipleLineStore统一提供校验逻辑
        if (this.ltsPipeLineStore.insightSpaces && this.ltsPipeLineStore.insightSpaces.length > index) {
            const spec = this.ltsPipeLineStore.specify(index);
            if (spec) {
                // this.spec = spec;
                const agg = !spec.schema.geomType?.includes('point');
                runInAction(() => {
                    this.spec = spec;
                    this.aggState = agg;
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
        this.aggState = aggState;
    }
    public async scanDetails (spaceIndex: number) {
        const result = await this.ltsPipeLineStore.scanDetails(spaceIndex);
        runInAction(() => {
            this.details = result;
        })
    }
    public getAssociatedViews () {
        console.log('get')
        const asso = this.ltsPipeLineStore.getAssociatedViews(this.pageIndex);
        runInAction(() => {
            this.assoListT1 = asso.assSpacesT1;
            this.assoListT2 = asso.assSpacesT2;
            this.showAsso = true;
        })
        // console.log(this.assoList)
    }
}
