import produce from "immer";
import { IReactionDisposer, makeAutoObservable, observable, reaction, runInAction, toJS } from "mobx";
import { IFieldEncode, IFilter, IPattern } from "@kanaries/loa";
import { Specification } from "visual-insights";
import { IResizeMode, IRow, ISpecSourceType, IVegaSubset } from "../../interfaces";
import { distVis } from "../../queries/distVis";
import { labDistVis } from "../../queries/labdistVis";
import { labDistVisService, loaEngineService } from "../../services/index";
import { DataSourceStore } from "../dataSourceStore";
import { adviceVisSize } from "../../pages/collection/utils";
import { IAssoViews, IMainVizSetting, IRenderViewKey, ISetting, makeInitAssoViews } from "./localTypes";

const RENDER_BATCH_SIZE = 5;

async function batchSpecify (assoViews: IAssoViews, vizAlgo: "lite" | "strict", mainVizSetting: IMainVizSetting, dataSource: IRow[]) {
    const { amount, views } = assoViews;
    const renderedViews = views.slice(0, amount);
    if (vizAlgo === 'lite') {
        return renderedViews.map(v => distVis({
            pattern: v,
            specifiedEncodes: v.encodes,
            excludeScaleZero: mainVizSetting.excludeScaleZero
        }))
    } else {
        return labDistVisService({
            dataSource,
            items: renderedViews.map(v => ({
                pattern: v,
                specifiedEncodes: v.encodes,
                excludeScaleZero: mainVizSetting.excludeScaleZero
            })),
        });
    }
}

export class SemiAutomationStore {
    public settings!: ISetting;
    public showSettings: boolean = false;
    public mainVizSetting!: IMainVizSetting;
    public pattViews!: IAssoViews;
    public featViews!: IAssoViews;
    public filterViews!: IAssoViews;
    public neighborViews!: IAssoViews;
    private dataSourceStore: DataSourceStore;
    public mainView: IPattern | null = null;
    public specForGraphicWalker: Specification = {};
    public showMiniFloatView: boolean = false;
    public neighborKeys: string[] = [];
    public mainViewSpecSource: ISpecSourceType = 'default';
    public autoAsso!: {
        [key in IRenderViewKey]: boolean;
    };
    private reactions: IReactionDisposer[] = [];
    constructor (dataSourceStore: DataSourceStore) {
        this.dataSourceStore = dataSourceStore;
        this.init();
        makeAutoObservable(this, {
            pattViews: observable.shallow,
            featViews: observable.shallow,
            filterViews: observable.shallow,
            neighborViews: observable.shallow,
            mainView: observable.ref,
            // @ts-expect-error private field
            dataSourceStore: false,
            reactions: false
        });
    }
    public init () {
        this.mainViewSpecSource = 'default';
        this.mainView = null;
        this.autoAsso = {
            pattViews: true,
            featViews: true,
            filterViews: true,
            neighborViews: true
        }
        this.mainVizSetting = {
            interactive: false,
            debug: false,
            resize: {
                mode: IResizeMode.auto,
                width: 320,
                height: 320,
            },
            nlg: false,
            excludeScaleZero: false
        }
        this.settings = {
            vizAlgo: 'strict'
        }
        this.pattViews = makeInitAssoViews(RENDER_BATCH_SIZE);
        this.featViews = makeInitAssoViews(RENDER_BATCH_SIZE);
        this.filterViews = makeInitAssoViews(RENDER_BATCH_SIZE);
        this.neighborViews = makeInitAssoViews(RENDER_BATCH_SIZE);
        this.reactions.push(reaction(() => {
            return {
                mainView: this.mainView,
                dataSource: this.dataSource,
                fieldMetas: this.fieldMetas,
                autoFeat: this.autoAsso.featViews,
                autoPatt: this.autoAsso.pattViews,
                autoFilter: this.autoAsso.filterViews,
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
            } else {
                autoPatt && this.initAssociate();
            }
        }))

        this.reactions.push(reaction(() => {
            return {
                mainView: this.mainView,
                dataSource: this.dataSource,
                fieldMetas: this.fieldMetas,
                autoNeighbor: this.autoAsso.neighborViews,
                neighborKeys: this.neighborKeys
            }
        }, (props) => {
            const { mainView, autoNeighbor, neighborKeys } = props;
            if (mainView && neighborKeys.length > 0) {
                autoNeighbor && this.neighborAssociate();
                !autoNeighbor && this.initRenderViews('neighborViews');
            } else {
                this.initRenderViews('neighborViews');
            }
        }))
    }
    public setMainViewSpecSource (sourceType: ISpecSourceType) {
        this.mainViewSpecSource = sourceType;
    }
    public changeMainViewSpecSource () {
        if (this.mainViewSpecSource === 'custom') {
            this.mainViewSpecSource = 'default'
        } else {
            this.mainViewSpecSource = 'custom'
        }
    }
    public clearStore () {
        this.reactions.forEach(clear => clear())
        this.reactions = [];
    }
    public setShowSettings (show: boolean) {
        this.showSettings = show;
    }
    public setNeighborKeys (keys: string[]) {
        this.neighborKeys = keys;
    }
    public clearNeighborKeys () {
        this.neighborKeys = [];
    }
    public updateSettings (skey: keyof ISetting, value: any) {
        this.settings[skey] = value;
    }
    public initRenderViews (akey: IRenderViewKey) {
        this[akey] = makeInitAssoViews();
    }
    public clearMainView () {
        this.mainView = null;
    }
    public initMainViewWithSingleField (fid: string) {
        const field = this.fieldMetas.find(f => f.fid === fid);
        if (field) {
            this.clearMainView()
            this.updateMainView({
                fields: [field],
                imp: field.features.entropy
            })
        }
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
    public get hasMainView () {
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
        return batchSpecify(this.pattViews, this.settings.vizAlgo, this.mainVizSetting, this.dataSource);
    }
    public get featSpecList () {
        // TODO: 这里的设计并不会带来性能上的优化，过去只会被计算一次的整体，现在反而要算的更多。
        // 仅仅对于联想视图比较多的场景会有优化。
        return batchSpecify(this.featViews, this.settings.vizAlgo, this.mainVizSetting, this.dataSource);
    }
    public get neighborSpecList () {
        return batchSpecify(this.neighborViews, this.settings.vizAlgo, this.mainVizSetting, this.dataSource);
    }
    public get filterSpecList () {
        // TODO: 这里的设计并不会带来性能上的优化，过去只会被计算一次的整体，现在反而要算的更多。
        // 仅仅对于联想视图比较多的场景会有优化。
        return batchSpecify(this.filterViews, this.settings.vizAlgo, this.mainVizSetting, this.dataSource);
    }

    public changeRenderAmount (stateKey: IRenderViewKey, size: number) {
        this[stateKey].amount = size;
    }
    // 为一个关联模块的渲染数量增加一个系统默认值
    public increaseRenderAmount (stateKey: IRenderViewKey) {
        const safeSize = Math.min(this[stateKey].amount + RENDER_BATCH_SIZE, this[stateKey].views.length)
        this.changeRenderAmount(stateKey, safeSize)
    }
    public updateAssoViews (viewKey: IRenderViewKey, views: IPattern[]) {
        this[viewKey].views = views;
        this[viewKey].amount = RENDER_BATCH_SIZE;
        this[viewKey].computing = false;
    }
    public endAssoViewComputing (viewKey: IRenderViewKey) {
        this[viewKey].computing = false;
    }
    public async neighborAssociate () {
        this.neighborViews.computing = true
        const { fieldMetas, dataSource, mainView } = this;
        const neighborKeys = toJS(this.neighborKeys)
        try {
            if (mainView === null) throw new Error('mainView is null');
            const viewFields = mainView.fields.filter(f => !neighborKeys.includes(f.fid));
            const res = await loaEngineService<IPattern[]>({
                dataSource,
                fields: fieldMetas,
                task: 'neighbors',
                props: {
                    fields: [...viewFields, { fid: '*', neighbors: neighborKeys, includeNeighbor: false}],
                    filters: mainView.filters,
                }
            }, 'local')
            this.updateAssoViews('neighborViews', res);
            return res;
        } catch (error) {
            console.error(error);
            this.endAssoViewComputing('neighborViews');
        }
    }
    public async featAssociate () {
        this.featViews.computing = true
        const { fieldMetas, dataSource, mainView } = this;
        try {
            const res = await loaEngineService<IPattern[]>({
                dataSource,
                fields: fieldMetas,
                task: 'featureSelection',
                props: mainView
            }, 'local')
            this.updateAssoViews('featViews', res)
        } catch (error) {
            console.error(error);
            this.endAssoViewComputing('featViews');
        }
    }
    public async pattAssociate () {
        this.pattViews.computing = true
        const { fieldMetas, dataSource, mainView } = this;
        try {
            const res = await loaEngineService<IPattern[]>({
                dataSource,
                fields: fieldMetas,
                task: 'patterns',
                props: mainView
            }, 'local')
            this.updateAssoViews('pattViews', res);
        } catch (error) {
            console.error(error);
            this.endAssoViewComputing('pattViews');
        }
    }
    public async initAssociate () {
        this.pattViews.computing = true;
        const { dataSource, fieldMetas } = this;
        try {
            const res = await loaEngineService<IPattern[]>({
                dataSource,
                fields: fieldMetas,
                task: 'univar'
            }, 'local')
            this.updateAssoViews('pattViews', res);
        } catch (error) {
            console.error(error);
            this.endAssoViewComputing('pattViews')
        }
    }
    public async filterAssociate () {
        if (this.mainView === null) return;
        this.filterViews.computing = true;
        const { fieldMetas, dataSource, mainView } = this;
        try {
            const res = await loaEngineService<IPattern[]>({
                dataSource,
                fields: fieldMetas,
                task: 'filterSelection',
                props: mainView
            }, 'local')
            this.updateAssoViews('filterViews', res);
        } catch (error) {
            console.error(error);
            this.endAssoViewComputing('filterViews');
        }
    }
    public get mainViewSpec (): IVegaSubset | null {
        const { mainVizSetting, mainView, fieldMetas } = this;
        if (mainView === null) return null
        if (this.settings.vizAlgo === 'lite') {
            return adviceVisSize(distVis({
                resizeMode: mainVizSetting.resize.mode,
                pattern: toJS(mainView),
                width: mainVizSetting.resize.width,
                height: mainVizSetting.resize.height,
                interactive: mainVizSetting.interactive,
                stepSize: 32,
                excludeScaleZero: mainVizSetting.excludeScaleZero,
                specifiedEncodes: mainView.encodes
            }), fieldMetas, 800, 500)
        } else {
            return adviceVisSize(labDistVis({
                resizeMode: mainVizSetting.resize.mode,
                pattern: toJS(mainView),
                width: mainVizSetting.resize.width,
                height: mainVizSetting.resize.height,
                interactive: mainVizSetting.interactive,
                stepSize: 32,
                dataSource: this.dataSource,
                excludeScaleZero: mainVizSetting.excludeScaleZero,
                specifiedEncodes: mainView.encodes
            }), fieldMetas, 800, 500)
        }
    }
    public addFieldEncode2MainViewPattern (encode: IFieldEncode) {
        if (this.mainView) {
            this.mainView = produce(this.mainView, draft => {
                if (!draft.encodes) {
                    draft.encodes = [];
                }
                draft.encodes.push(encode)
            })
        }
    }
    public removeFieldEncodeFromMainViewPattern (encode: IFieldEncode) {
        if (this.mainView) {
            this.mainView = produce(this.mainView, draft => {
                if (!draft.encodes) {
                    draft.encodes = [];
                }
                draft.encodes = draft.encodes.filter(e => e.field !== encode.field)
            })
        }
    }
    public addMainViewField (fieldId: string) {
        if (this.mainView === null) return;
        const targetFieldIndex = this.fieldMetas.findIndex(f => f.fid === fieldId);
        this.mainView = produce(this.mainView, draft => {
            draft.fields.push(this.fieldMetas[targetFieldIndex])
        })
    }
    public removeMainViewFilter (filterFieldId: string) {
        if (!this.mainView?.filters) return;
        this.mainView = produce(this.mainView, draft => {
            draft.filters = draft.filters!.filter(f => f.fid !== filterFieldId)
        })
    }
    public addMainViewFilter (filter: IFilter) {
        if (!this.mainView) return;
        if (typeof this.mainView.filters === 'undefined') this.mainView.filters = [];
        this.mainView = produce(this.mainView, draft => {
            draft.filters!.push(filter)
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
        this.neighborViews = makeInitAssoViews();
    }
    public initRenderSize () {
        this.featViews.amount = RENDER_BATCH_SIZE;
        this.pattViews.amount = RENDER_BATCH_SIZE;
        this.filterViews.amount = RENDER_BATCH_SIZE;
        this.neighborViews.amount = RENDER_BATCH_SIZE;
    }
    public updateMainView (view: IPattern) {
        this.mainView = view;
        // this.initAssociate()
        // this.clearViews();
    }
}