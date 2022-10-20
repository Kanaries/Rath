import { makeAutoObservable, observable } from "mobx";
import { IFieldMeta, IFilter, IInsightVizView, IVegaSubset } from "../interfaces";
import { DataSourceStore } from "./dataSourceStore";

function serializeFilter (filter: IFilter) {
    return `${filter.fid}=${filter.type === 'range' ? filter.range.join('-') : filter.values.join('_')}`
}

function encodeViewKey (fields: IFieldMeta[], spec: IVegaSubset, filters: IFilter[]) {
    return `${fields.map(f => f.fid).join(',')}|${JSON.stringify(spec)}|${filters.map(f => serializeFilter(f)).join(',')}`
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
    public collectView (fields: IFieldMeta[], spec: IVegaSubset, filters: IFilter[] | undefined = []) {
        const visId = `vis-${new Date().getTime()}`;
        const vizCode = encodeViewKey(fields, spec, filters);
        if (!this.vizHash.has(vizCode)) {
            this.vizHash.set(vizCode, visId);
            this.collectionList.push({
                viewId: `vis-${new Date().getTime()}`,
                fields,
                filters,
                spec
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
    public removeView (fields: IFieldMeta[], spec: IVegaSubset, filters: IFilter[] | undefined = []) {
        const vizCode = encodeViewKey(fields, spec, filters);
        this.removeViewByCode(vizCode);
    }
    public toggleCollectState (fields: IFieldMeta[], spec: IVegaSubset, filters: IFilter[] | undefined = []) {
        const vizCode = encodeViewKey(fields, spec, filters);
        if (this.vizHash.has(vizCode)) {
            this.removeViewByCode(vizCode)
        } else {
            this.collectView(fields, spec, filters)
        }
    }
    public removeViewByIndex (index: number) {
        this.collectionList.splice(index, 1)
        // const vizCode = encodeViewKey(fields, spec);
        // this.vizHash.delete(vizCode)
    }
    public collectionContains (fields: IFieldMeta[], spec: IVegaSubset, filters: IFilter[] | undefined = []) {
        // FIXME
        // TODO
        // 这里还需要filter的信息，才能保证图表的唯一性。
        const vizCode = encodeViewKey(fields, spec, filters);
        return this.vizHash.has(vizCode)
    }
}