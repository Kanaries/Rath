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
    public painting: boolean = false;
    public linkTrigger: number = 0;
    public autoLink: boolean = false;
    public painterView: {
        spec: IVegaSubset | null;
        dataView: IPattern | null;
    } = {
        spec: null,
        dataView: null,
    };
    private commonStore: CommonStore;
    private dataSourceStore: DataSourceStore;
    private semiAutoStore: SemiAutomationStore;
    constructor(commonStore: CommonStore, dataSourceStore: DataSourceStore, semiAutoStore: SemiAutomationStore) {
        this.commonStore = commonStore;
        this.dataSourceStore = dataSourceStore;
        this.semiAutoStore = semiAutoStore;
        makeAutoObservable(this, {
            painterView: observable.shallow,
            // @ts-ignore
            commonStore: false,
            dataSourceStore: false,
            semiAutoStore: false,
        });
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
        this.painterView.dataView = pattern;
        this.painterView.spec = spec;
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
            const mainView = toJS(this.painterView.dataView);
            this.painterView.spec =
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
        }
    }
    public addMainViewField(fieldId: string) {
        if (this.painterView.dataView === null) return;
        const targetFieldIndex = this.fieldMetas.findIndex((f) => f.fid === fieldId);
        this.painterView.dataView = produce(this.painterView.dataView, (draft) => {
            draft.fields.push(this.fieldMetas[targetFieldIndex]);
        });
    }
    public removeMainViewFilter(filterFieldId: string) {
        if (!this.painterView.dataView?.filters) return;
        this.painterView.dataView = produce(this.painterView.dataView, (draft) => {
            draft.filters = draft.filters!.filter((f) => f.fid !== filterFieldId);
        });
    }
    public addMainViewFilter(filter: IFilter) {
        if (!this.painterView.dataView) return;
        if (typeof this.painterView.dataView.filters === 'undefined') this.painterView.dataView.filters = [];
        this.painterView.dataView = produce(this.painterView.dataView, (draft) => {
            draft.filters!.push(filter);
        });
    }
    public removeMainViewField(fieldId: string) {
        if (this.painterView.dataView === null) return;
        const targetFieldIndex = this.painterView.dataView.fields.findIndex((f) => f.fid === fieldId);
        this.painterView.dataView = produce(this.painterView.dataView, (draft) => {
            draft.fields.splice(targetFieldIndex, 1);
        });
    }
}
