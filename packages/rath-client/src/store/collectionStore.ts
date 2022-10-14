import { makeAutoObservable, observable } from "mobx";
import { IFieldMeta, IInsightVizView, IVegaSubset } from "../interfaces";
import { DataSourceStore } from "./dataSourceStore";

function encodeViewKey (fields: IFieldMeta[], spec: IVegaSubset) {
    return `${fields.map(f => f.fid).join(',')}|${JSON.stringify(spec)}`
}

export class CollectionStore {
    private dataSourceStore: DataSourceStore;
    private vizHash: Map<string, string>;
    public collectionList: IInsightVizView[] = [];
    constructor (dataSourceStore: DataSourceStore) {
        this.dataSourceStore = dataSourceStore;
        this.vizHash = new Map();
        makeAutoObservable(this, {
            collectionList: observable.shallow
        })
    }
    public collectView (fields: IFieldMeta[], spec: IVegaSubset) {
        const visId = `vis-${new Date().getTime()}`;
        const vizCode = encodeViewKey(fields, spec);
        if (!this.vizHash.has(vizCode)) {
            this.vizHash.set(vizCode, visId);
            this.collectionList.push({
                viewId: `vis-${new Date().getTime()}`,
                fields,
                spec
            })
        }
    }
    public removeView (index: number) {
        this.collectionList.splice(index, 1)
        // const vizCode = encodeViewKey(fields, spec);
        // this.vizHash.delete(vizCode)
    }
    public collectionContains (fields: IFieldMeta[], spec: IVegaSubset) {
        // FIXME
        // TODO
        // 这里还需要filter的信息，才能保证图表的唯一性。
        const vizCode = encodeViewKey(fields, spec);
        return this.vizHash.has(vizCode)
    }
}