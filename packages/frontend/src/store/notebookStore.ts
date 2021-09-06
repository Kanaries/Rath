import { makeAutoObservable } from "mobx";
import { FieldSummary, Subspace } from "../service";
import { fieldMeta2fieldSummary } from "../utils/transform";
import { LitePipeStore } from "./pipeLineStore/lite";

export class NoteBookStore {
    private pipeLineStore: LitePipeStore;
    constructor (pipeLineStore: LitePipeStore) {
        makeAutoObservable(this);
        this.pipeLineStore = pipeLineStore
    }
    public get summary (): { origin: FieldSummary[]; grouped: FieldSummary[]; } {
        const { originMetas, transedMetas } = this.pipeLineStore.cookedDataset;
        const metasOnlyInTransedMetas = transedMetas.filter(tm => originMetas.findIndex(om => tm.fid !== om.fid) === -1);
        return {
            origin: fieldMeta2fieldSummary(originMetas),
            grouped: fieldMeta2fieldSummary(metasOnlyInTransedMetas)
        }
    }
    public get totalDataSubspaceSize () {
        return this.pipeLineStore.fullDataSubspacesRef.current.length;
    }
    public get subspaceList (): Subspace[] {
        return this.pipeLineStore.dataSubspaces;
    }

    public get viewSpaces () {
        return this.pipeLineStore.viewSpaces
    }

    public get measureAmount () {
        return this.pipeLineStore.cookedDataset.transedMetas.length
    }

    public get dataSource () {
        return this.pipeLineStore.cookedDataset.transedData
    }
    public get progressTag () {
        return this.pipeLineStore.progressTag;
    }
    public get TOP_K_DIM_PERCENT () { return this.pipeLineStore.TOP_K_DIM_PERCENT }
    public get TOP_K_MEA_PERCENT () { return this.pipeLineStore.TOP_K_MEA_PERCENT }
    public get TOP_K_DIM_GROUP_NUM () { return this.pipeLineStore.TOP_K_DIM_GROUP_NUM }
    public get MAX_MEA_GROUP_NUM () { return this.pipeLineStore.MAX_MEA_GROUP_NUM }
    public setParams (paramKey: 'TOP_K_DIM_PERCENT' | 'TOP_K_MEA_PERCENT' | 'TOP_K_DIM_GROUP_NUM' | 'MAX_MEA_GROUP_NUM', value: number) {
        this.pipeLineStore[paramKey] = value;
    }
}