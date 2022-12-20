import { applyFilters, IFilter, IPattern } from '@kanaries/loa';
import produce from 'immer';
import { makeAutoObservable, observable, toJS } from 'mobx';
import { PIVOT_KEYS } from '../constants';
import { IVegaSubset } from '../interfaces';
import { distVis } from '../queries/distVis';
import { labDistVis } from '../queries/labdistVis';
import { CommonStore } from './commonStore';
import { DataSourceStore } from './dataSourceStore';
import { SemiAutomationStore } from './semiAutomation/mainStore';

export class PainterStore {
    public painting!: boolean;
    public linkTrigger!: number;
    public autoLink!: boolean;
    public painterView!: {
        spec: IVegaSubset | null;
        dataView: IPattern | null;
    };
    private commonStore: CommonStore;
    private dataSourceStore: DataSourceStore;
    private semiAutoStore: SemiAutomationStore;
    constructor(commonStore: CommonStore, dataSourceStore: DataSourceStore, semiAutoStore: SemiAutomationStore) {
        this.commonStore = commonStore;
        this.dataSourceStore = dataSourceStore;
        this.semiAutoStore = semiAutoStore;
        this.init();
        makeAutoObservable(this, {
            painterView: observable.ref,
            // @ts-ignore
            commonStore: false,
            dataSourceStore: false,
            semiAutoStore: false,
        });
    }
    public init () {
        this.painterView = {
            spec: null,
            dataView: null,
        };
        this.painting = false;
        this.linkTrigger = 0;
        this.autoLink = false;
    }
    public destroy() {
        this.painterView = {
            spec: null,
            dataView: null,
        };
    }
    public get fieldMetas() {
        return this.dataSourceStore.fieldMetas;
    }
    public get painterViewData() {
        if (this.painterView.dataView?.filters) {
            return applyFilters(this.dataSourceStore.cleanedData, this.painterView.dataView?.filters);
        }
        return this.dataSourceStore.cleanedData;
    }
    public setPainting(state: boolean) {
        if (this.painting !== state) {
            this.painting = state;
        }
    }
    public analysisInPainter(spec: IVegaSubset, pattern: IPattern) {
        this.painterView = {
            dataView: toJS(pattern),
            spec: toJS(spec),
        }
        this.commonStore.setAppKey(PIVOT_KEYS.painter);
    }
    public setPaintingForTrigger(state: boolean) {
        if (this.painting !== state && this.autoLink) {
            this.painting = state;
        }
    }
    public pullTrigger() {
        if (this.autoLink) {
            this.linkTrigger = (this.linkTrigger + 1) % 1000;
        }
    }
    public setAutoLinkMode(auto: boolean) {
        this.autoLink = auto;
    }
    public updateViewSpec() {
        if (this.painterView.dataView !== null) {
            const { mainVizSetting, settings } = this.semiAutoStore;
            const mainView = this.painterView.dataView;
            this.painterView = produce(this.painterView, (draft) => {
                draft.spec =
                settings.vizAlgo === 'lite'
                    ? distVis({
                          resizeMode: mainVizSetting.resize.mode,
                          pattern: mainView,
                          width: mainVizSetting.resize.width,
                          height: mainVizSetting.resize.height,
                          interactive: mainVizSetting.interactive,
                          stepSize: 28,
                          excludeScaleZero: mainVizSetting.excludeScaleZero,
                          specifiedEncodes: mainView.encodes,
                      })
                    : labDistVis({
                          resizeMode: mainVizSetting.resize.mode,
                          pattern: mainView,
                          width: mainVizSetting.resize.width,
                          height: mainVizSetting.resize.height,
                          interactive: mainVizSetting.interactive,
                          stepSize: 28,
                          dataSource: this.painterViewData,
                          excludeScaleZero: mainVizSetting.excludeScaleZero,
                          specifiedEncodes: mainView.encodes,
                      });
            })
        }
    }
    public addMainViewField(fieldId: string) {
        if (this.painterView.dataView === null) return;
        const targetFieldIndex = this.fieldMetas.findIndex((f) => f.fid === fieldId);
        this.painterView = produce(this.painterView, (draft) => {
            draft.dataView!.fields.push(this.fieldMetas[targetFieldIndex]);
        });
        this.updateViewSpec()
    }
    public removeMainViewFilter(filterFieldId: string) {
        if (!this.painterView.dataView?.filters) return;
        this.painterView = produce(this.painterView, (draft) => {
            draft.dataView!.filters = draft.dataView!.filters!.filter((f) => f.fid !== filterFieldId);
        });
        this.updateViewSpec();
    }
    public addMainViewFilter(filter: IFilter) {
        if (!this.painterView.dataView) return;
        // if (typeof this.painterView.dataView.filters === 'undefined') this.painterView.dataView.filters = [];
        this.painterView = produce(this.painterView, (draft) => {
            if (typeof draft.dataView!.filters === 'undefined') draft.dataView!.filters = [];
            draft.dataView!.filters!.push(filter);
        });
        this.updateViewSpec();
    }
    public removeMainViewField(fieldId: string) {
        if (this.painterView.dataView === null) return;
        const targetFieldIndex = this.painterView.dataView.fields.findIndex((f) => f.fid === fieldId);
        this.painterView = produce(this.painterView, (draft) => {
            draft.dataView!.fields.splice(targetFieldIndex, 1);
        });
        this.updateViewSpec();
    }
}
