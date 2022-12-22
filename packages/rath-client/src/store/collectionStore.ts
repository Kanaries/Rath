import { makeAutoObservable, observable, runInAction, toJS } from "mobx";
import { IFieldMeta, IFilter, IInsightVizView, IVegaSubset, IVisSpecType } from "../interfaces";
import { DataSourceStore } from "./dataSourceStore";

function serializeFilter (filter: IFilter) {
    return `${filter.fid}=${filter.type === 'range' ? filter.range.join('-') : filter.values.join('_')}`
}

function encodeViewKey (fields: IFieldMeta[], spec: IVegaSubset, specType: IVisSpecType, filters: IFilter[]) {
    return `${fields.map(f => f.fid).join(',')}|${specType}|${JSON.stringify(spec)}|${filters.map(f => serializeFilter(f)).join(',')}`
}

export class CollectionStore {
    private dataSourceStore: DataSourceStore;
    public vizHash: Map<string, string>;
    public collectionList: IInsightVizView[] = [];
    constructor (dataSourceStore: DataSourceStore) {
        this.dataSourceStore = dataSourceStore;
        this.vizHash = new Map();
        makeAutoObservable(this, {
            collectionList: observable.shallow,
            // @ts-expect-error private field
            dataSourceStore: false,
        })
    }
    public collectView (fields: IFieldMeta[], spec: IVegaSubset, specType: IVisSpecType, filters: IFilter[] | undefined = []) {
        const visId = `vis-${new Date().getTime()}`;
        const vizCode = encodeViewKey(fields, spec, specType, filters);
        if (!this.vizHash.has(vizCode)) {
            this.vizHash.set(vizCode, visId);
            this.collectionList.push({
                viewId: visId,
                fields,
                filters,
                spec,
                specType
            })
        }
    }
    private removeViewByCode (vizCode: string) {
        if (this.vizHash.has(vizCode)) {
            const visId = this.vizHash.get(vizCode);
            const targetIndex = this.collectionList.findIndex(c => c.viewId === visId)
            if (targetIndex > -1) {
                this.collectionList.splice(targetIndex, 1)
                this.vizHash.delete(vizCode);
            }
        }
    }
    public removeView (fields: IFieldMeta[], spec: IVegaSubset, specType: IVisSpecType, filters: IFilter[] | undefined = []) {
        const vizCode = encodeViewKey(fields, spec, specType, filters);
        this.removeViewByCode(vizCode);
    }
    public toggleCollectState (fields: IFieldMeta[], spec: IVegaSubset, specType: IVisSpecType, filters: IFilter[] | undefined = []) {
        const vizCode = encodeViewKey(fields, spec, specType, filters);
        if (this.vizHash.has(vizCode)) {
            this.removeViewByCode(vizCode)
        } else {
            this.collectView(fields, spec, specType, filters)
        }
    }
    public removeViewByIndex (index: number) {
        this.collectionList.splice(index, 1)
        // const vizCode = encodeViewKey(fields, spec);
        // this.vizHash.delete(vizCode)
    }
    public collectionContains (fields: IFieldMeta[], spec: IVegaSubset, specType: IVisSpecType, filters: IFilter[] | undefined = []) {
        const vizCode = encodeViewKey(fields, spec, specType, filters);
        return this.vizHash.has(vizCode)
    }
    public addConfigCollectionList(value: IInsightVizView[]) {
        this.collectionList = value;
    }
    public init () {
        this.collectionList = [];
        this.vizHash.clear();
    }
    public async backupCollectionStore () {
        return {
            collectionList: toJS(this.collectionList),
            vizHash: Array.from(this.vizHash.entries())
        }
    }
    public async loadBackup (data: Awaited<ReturnType<CollectionStore['backupCollectionStore']>>) {
        runInAction(() => {
            this.collectionList = data.collectionList;
            this.vizHash = new Map(data.vizHash);
        });
    }
}