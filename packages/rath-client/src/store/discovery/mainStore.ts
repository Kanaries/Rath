import produce from "immer";
import { makeAutoObservable, observable, reaction, runInAction } from "mobx";
import { IPattern } from "../../dev";
import { IFieldMeta, IResizeMode } from "../../interfaces";
import { distVis } from "../../queries/distVis";
import { labDistVis } from "../../queries/labdistVis";
import { footmanEngineService } from "../../service";
import { DataSourceStore } from "../dataSourceStore";
import { IAssoViews, IMainVizSetting, IRenderViewKey, ISetting, makeInitAssoViews } from "./localTypes";

const RENDER_BATCH_SIZE = 5;

export class DiscoveryMainStore {
    public settings: ISetting;
    public showSettings: boolean = false;
    public mainVizSetting: IMainVizSetting;
    public pattViews: IAssoViews;
    public featViews: IAssoViews;
    public filterViews: IAssoViews;
    private dataSourceStore: DataSourceStore;
    public mainView: IPattern | null = null;
    public compareView: IPattern | null = null;
    public showMiniFloatView: boolean = false;
    public autoAsso: {
        [key in IRenderViewKey]: boolean;
    } = {
        pattViews: true,
        featViews: true,
        filterViews: true
    }
    private reactions: any[] = [];
    constructor (dataSourceStore: DataSourceStore) {
        this.dataSourceStore = dataSourceStore;
        this.mainVizSetting = {
            interactive: false,
            debug: false,
            resize: {
                mode: IResizeMode.auto,
                width: 320,
                height: 320,
            },
            nlg: false
        }
        this.settings = {
            vizAlgo: 'strict'
        }
        this.pattViews = makeInitAssoViews(RENDER_BATCH_SIZE);
        this.featViews = makeInitAssoViews(RENDER_BATCH_SIZE);
        this.filterViews = makeInitAssoViews(RENDER_BATCH_SIZE);
        this.reactions.push(reaction(() => {
            return {
                mainView: this.mainView,
                dataSource: this.dataSource,
                fieldMetas: this.fieldMetas,
                autoFeat: this.autoAsso.featViews,
                autoPatt: this.autoAsso.pattViews,
                autoFilter: this.autoAsso.filterViews
            }
        }, (props) => {
            const { mainView, autoFeat, autoFilter, autoPatt } = props;
            if (mainView) {
                autoPatt && this.pattAssociate();
                !autoPatt && this.initRenderViews('pattViews')
                autoFeat && this.featAssociate();
                !autoPatt && this.initRenderViews('featViews');
                autoFilter && this.filterAssociate();
                !autoFilter && this.initRenderViews('filterViews');
            }
        }))

        makeAutoObservable(this, {
            pattViews: observable.shallow,
            featViews: observable.shallow,
            filterViews: observable.shallow,
            mainView: observable.ref,
            compareView: observable.ref
        });
    }
    public setShowSettings (show: boolean) {
        this.showSettings = show;
    }
    public updateSettings (skey: keyof ISetting, value: any) {
        this.settings[skey] = value;
    }
    public initRenderViews (akey: IRenderViewKey) {
        this[akey] = makeInitAssoViews();
    }
    public updateAutoAssoConfig (akey: IRenderViewKey, value: boolean) {
        this.autoAsso[akey] = value;
    }
    public updateMainVizSettings (updater: (s: IMainVizSetting) => void) {
        runInAction(() => {
            updater(this.mainVizSetting);
        })
    }
    public setShowMiniFloatView (show: boolean) {
        this.showMiniFloatView = show;
    }
    public hasMainView () {
        return this.mainView !== null
    }
    public get dataSource () {
        return this.dataSourceStore.cleanedData;
    }
    public get fieldMetas () {
        return this.dataSourceStore.fieldMetas;
    }
    public get pattSpecList () {
        // TODO: 这里的设计并不会带来性能上的优化，过去只会被计算一次的整体，现在反而要算的更多。
        // 仅仅对于联想视图比较多的场景会有优化。
        const { amount, views } = this.pattViews;
        const renderedViews = views.slice(0, amount);
        if (this.settings.vizAlgo === 'lite') {
            return renderedViews.map(v => distVis({
                pattern: v
            }))
        } else {
            return renderedViews.map(v => labDistVis({
                pattern: v,
                dataSource: this.dataSource
            }))
        }
    }
    public get featSpecList () {
        // TODO: 这里的设计并不会带来性能上的优化，过去只会被计算一次的整体，现在反而要算的更多。
        // 仅仅对于联想视图比较多的场景会有优化。
        const { amount, views } = this.featViews;
        const renderedViews = views.slice(0, amount);
        if (this.settings.vizAlgo === 'lite') {
            return renderedViews.map(v => distVis({
                pattern: v
            }))
        } else {
            return renderedViews.map(v => labDistVis({
                pattern: v,
                dataSource: this.dataSource
            }))
        }
    }
    public get filterSpecList () {
        // TODO: 这里的设计并不会带来性能上的优化，过去只会被计算一次的整体，现在反而要算的更多。
        // 仅仅对于联想视图比较多的场景会有优化。
        const { amount, views } = this.filterViews;
        const renderedViews = views.slice(0, amount);
        if (this.settings.vizAlgo === 'lite') {
            return renderedViews.map(v => distVis({
                pattern: v
            }))
        } else {
            return renderedViews.map(v => labDistVis({
                pattern: v,
                dataSource: this.dataSource
            }))
        }
    }

    public changeRenderAmount (stateKey: IRenderViewKey, size: number) {
        this[stateKey].amount = size;
    }
    // 为一个关联模块的渲染数量增加一个系统默认值
    public increaseRenderAmount (stateKey: IRenderViewKey) {
        const safeSize = Math.min(this[stateKey].amount + RENDER_BATCH_SIZE, this[stateKey].views.length)
        this.changeRenderAmount(stateKey, safeSize)
    }
    public async featAssociate () {
        this.featViews.computing = true
        const { fieldMetas, dataSource, mainView } = this;
        try {
            const res = await footmanEngineService<IPattern[]>({
                dataSource,
                fields: fieldMetas,
                task: 'featureSelection',
                props: mainView
            }, 'local')
            runInAction(() => {
                this.featViews.views = res;
                this.featViews.amount = RENDER_BATCH_SIZE;
                this.featViews.computing = false;
            })
        } catch (error) {
            console.error(error);
            this.featViews.computing = false;
        }
    }
    public async pattAssociate () {
        this.pattViews.computing = true
        const { fieldMetas, dataSource, mainView } = this;
        try {
            const res = await footmanEngineService<IPattern[]>({
                dataSource,
                fields: fieldMetas,
                task: 'patterns',
                props: mainView
            }, 'local')
            runInAction(() => {
                this.pattViews.views = res;
                this.pattViews.amount = RENDER_BATCH_SIZE;
                this.pattViews.computing = false;
            })
        } catch (error) {
            console.error(error);
            this.pattViews.computing = false;
        }
    }
    public async initAssociate () {
        this.pattViews.computing = true;
        const { dataSource, fieldMetas } = this;
        try {
            const res = await footmanEngineService<IPattern[]>({
                dataSource,
                fields: fieldMetas,
                task: 'univar'
            }, 'local')
            runInAction(() => {
                this.pattViews.computing = false;
                this.pattViews.views = res;
                this.pattViews.amount = RENDER_BATCH_SIZE;
            })
        } catch (error) {
            console.error(error);
            this.pattViews.computing = false;
        }
    }
    public async filterAssociate () {
        if (this.mainView === null) return;
        this.filterViews.computing = true;
        const { fieldMetas, dataSource, mainView } = this;
        try {
            const res = await footmanEngineService<IPattern[]>({
                dataSource,
                fields: fieldMetas,
                task: 'filterSelection',
                props: mainView
            }, 'local')
            runInAction(() => {
                this.filterViews.views = res;
                this.filterViews.amount = RENDER_BATCH_SIZE;
                this.filterViews.computing = false;
            })
        } catch (error) {
            console.error(error);
            this.filterViews.computing = false;
        }
    }
    public removeMainViewFilter (filterFieldId: string) {
        if (!this.mainView?.filters) return;
        this.mainView = produce(this.mainView, draft => {
            draft.filters = draft.filters!.filter(f => f.field.fid !== filterFieldId)
        })
    }
    public removeMainViewField (fieldId: string) {
        if (this.mainView === null) return;
        const targetFieldIndex = this.mainView.fields.findIndex(f => f.fid === fieldId);
        this.mainView = produce(this.mainView, draft => {
            draft.fields.splice(targetFieldIndex, 1)
        })
    }
    public clearViews () {
        this.featViews = makeInitAssoViews();
        this.pattViews = makeInitAssoViews();
        this.filterViews = makeInitAssoViews();
    }
    public initRenderSize () {
        this.featViews.amount = RENDER_BATCH_SIZE;
        this.pattViews.amount = RENDER_BATCH_SIZE;
        this.filterViews.amount = RENDER_BATCH_SIZE;
    }
    public updateMainView (view: IPattern) {
        this.mainView = view;
        // this.initAssociate()
        // this.clearViews();
    }
    public updateCompareView (view: IPattern) {
        this.compareView = view;
        this.mainVizSetting.resize.mode = IResizeMode.auto;
    }
    public async explainViewDiff (view1: IPattern, view2: IPattern) {
        if (this.mainView === null) return;
        this.featViews.computing = true
        const { fieldMetas, dataSource } = this;
        try {
            const res = await footmanEngineService<{ features: IFieldMeta[] }>({
                dataSource,
                fields: fieldMetas,
                task: 'filterSelection',
                props: [view1, view2]
            }, 'local')
            runInAction(() => {
                if (this.mainView) {
                    this.clearViews();
                    this.featViews.views = [
                        {
                            ...this.mainView,
                            fields: [...this.mainView!.fields, ...res.features]
                        },
                        {
                            ...this.mainView,
                            fields: [...this.mainView!.fields, ...res.features]
                        }
                    ]
                }
                this.featViews.computing = false;
            })
        } catch (error) {
            console.error(error);
            this.featViews.computing = false
        }
    }
}