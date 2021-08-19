import { makeAutoObservable, reaction } from "mobx";
import { fromStream, IStreamListener, toStream } from "mobx-utils";
import { from, Subscription } from "rxjs";
import { Subspace, ViewSpace } from "../../service";
import { getDataEventStreams, ICookedDataset, IDataEventStreams, IUnivarateSummary } from "../../stream/litePipe";
import { DataSourceStore } from "../dataSourceStore";

export type IPipeProgressTag = 'univar' | 'subspace' | 'others' | 'none'

// 老版本是 4，这里我随便改的。发现不对劲的话就改回去
const EXPECTED_MAX_MEA_IN_VIEW = 3;

export class LitePipeStore {
    private dataSourceStore: DataSourceStore;
    private streams: IDataEventStreams;
    private subscrptions: Subscription[] = [];
    public cookedDatasetRef: IStreamListener<ICookedDataset>;
    // public viewSpaces: ViewSpace[] = [];
    public viewSpacesRef: IStreamListener<ViewSpace[]>;
    public univarRef: IStreamListener<IUnivarateSummary>;
    public dataSubspacesRef: IStreamListener<Subspace[]>;
    public TOP_K_DIM_PERCENT: number = 0.72;
    public TOP_K_MEA_PERCENT: number = 1;
    public TOP_K_DIM_GROUP_PERCENT: number = 0.3;
    public MAX_MEA_GROUP_NUM: number = 4;
    public progressTag: IPipeProgressTag = 'none'
    constructor (dataSourceStore: DataSourceStore) {
        makeAutoObservable(this);
        this.dataSourceStore = dataSourceStore;
        const dataSource$ = from(toStream(() => dataSourceStore.cleanedData));
        const fields$ = from(toStream(() => dataSourceStore.fields));
        const streams = getDataEventStreams(dataSource$, fields$, {
            TOP_K_DIM_PERCENT$: from(toStream(() => this.TOP_K_DIM_PERCENT, true)),
            TOP_K_DIM_GROUP_PERCENT$: from(toStream(() => this.TOP_K_DIM_GROUP_PERCENT, true)),
            MAX_MEA_GROUP_NUM$: from(toStream(() => this.MAX_MEA_GROUP_NUM, true))
        });
        this.streams = streams;
        this.cookedDatasetRef = fromStream(this.streams.cookedDataset$, {
            dimMetas: [],
            meaMetas: [],
            transedData: [],
            transedMetas: [],
            originMetas: []
        });
        this.viewSpacesRef = fromStream(streams.viewSpaces$, []);
        this.univarRef = fromStream(streams.univar$, { transedData: [], transedMetas: [], originMetas: [] });
        this.dataSubspacesRef = fromStream(streams.dataSubspaces$, []);

        // 订阅流，用于捕获计算阶段转换信号。
        this.subscrptions.push(streams.univar$.subscribe(() => {
            this.progressTag = 'subspace'
        }))

        this.subscrptions.push(streams.dataSubspaces$.subscribe(() => {
            this.progressTag = 'others'
        }))

        this.subscrptions.push(streams.viewSpaces$.subscribe(() => {
            this.progressTag = 'none'
        }))

        reaction<number>(() => this.cookedDataset.transedMetas.length, (length) => {
            console.log('length change', length, length / EXPECTED_MAX_MEA_IN_VIEW)
            this.MAX_MEA_GROUP_NUM = Math.round(length / EXPECTED_MAX_MEA_IN_VIEW);
        })
    }
    public get viewSpaces () {
        return this.viewSpacesRef.current;
    }
    public get univarSummary () {
        return this.univarRef.current;
    }
    public get dataSubspaces () {
        return this.dataSubspacesRef.current
    }
    public get cookedDataset () {
        return this.cookedDatasetRef.current
    }
    public setProcessTag (tag: IPipeProgressTag) {
        this.progressTag = tag;
    }
    public async startTask () {
        this.progressTag = 'univar';
        this.streams.start$.next(true);
    }
    /**
     * 应用初始化，订阅事件流，并把订阅集中存储用于未来释放。
     */
    public init () {
        
    }
    /**
     * 销毁应用状态，释放掉所有的相关订阅。
     */
    public destroy () {
        this.subscrptions.forEach(sub => {
            sub.unsubscribe();
        })
        this.subscrptions = [];
    }
}