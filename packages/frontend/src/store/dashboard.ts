import { makeAutoObservable, observable, runInAction } from "mobx";
import { Aggregator } from "../global";
import { DashBoard, generateDashBoard } from "../service";
import { LitePipeStore } from "./pipeLineStore/lite";

export class DashBoardStore {
    public dashBoardList: DashBoard[] = [];
    public pageIndex: number = 0;
    public loading: boolean = false;
    private pipeLineStore: LitePipeStore;
    public showConfigPanel: boolean = false;
    public config: {
        aggregator: Aggregator;
    }
    constructor (pipleLineStore: LitePipeStore) {
        this.config = {
            aggregator: 'sum'
        }
        makeAutoObservable(this, {
            dashBoardList: observable.ref
        });
        this.pipeLineStore = pipleLineStore;
    }
    public async generateDashBoard () {
        this.loading = true;
        try {
            const dashBoardList = await generateDashBoard({
                dataSource: this.pipeLineStore.cookedDataset.transedData,
                dimensions: this.pipeLineStore.cookedDataset.dimMetas.map(f => f.fid),
                measures: this.pipeLineStore.cookedDataset.meaMetas.map(f => f.fid),
                subspaces: this.pipeLineStore.dataSubspaces
            });
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
    public setShowConfig (show: boolean) {
        this.showConfigPanel = show;
    }
    public setPageIndex (index: number) {
        if (!isNaN(index)) {
            this.pageIndex = index;
        }
    }
    public setAggregator (op: Aggregator) {
        this.config.aggregator = op;
    }
}