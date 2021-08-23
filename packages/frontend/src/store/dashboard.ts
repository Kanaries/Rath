import { makeAutoObservable, observable, runInAction } from "mobx";
import { DashBoard, generateDashBoard } from "../service";
import { LitePipeStore } from "./pipeLineStore/lite";

export class DashBoardStore {
    public dashBoardList: DashBoard[] = [];
    public pageIndex: number = 0;
    public loading: boolean = false;
    private pipeLineStore: LitePipeStore;
    constructor (pipleLineStore: LitePipeStore) {
        makeAutoObservable(this, {
            dashBoardList: observable.ref
        });
        this.pipeLineStore = pipleLineStore;
    }
    public async generateDashBoard () {
        // this.pipeLineStore = 
        this.loading = true;
        try {
            const dashBoardList = await generateDashBoard(
                this.pipeLineStore.cookedDataset.transedData,
                this.pipeLineStore.cookedDataset.dimMetas.map(f => f.fid),
                this.pipeLineStore.cookedDataset.meaMetas.map(f => f.fid),
                this.pipeLineStore.dataSubspaces
            );
            runInAction(() => {
                this.dashBoardList = dashBoardList;
                this.loading = false;
            })
        } catch (error) {
            console.error(error);
        }
    }
    /**
     * @deprecated
     */
    public get pageDisabled () {
        return this.pipeLineStore.dataSubspaces.length === 0
    }
    public setPageIndex (index: number) {
        if (!isNaN(index)) {
            this.pageIndex = index;
        }
    }
}