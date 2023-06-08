import produce from "immer";
import { makeAutoObservable, observable, reaction, runInAction, toJS } from "mobx";
import { combineLatest, from, map, Observable, share, Subject, switchAll, throttleTime } from "rxjs";
import type { IFieldMeta, IFilter, ICol, IRow, IteratorStorageMetaInfo } from "../../interfaces";
import { filterDataService } from "../../services";
import { IteratorStorage } from "../../utils/iteStorage";
import { focusedSample } from "../../utils/sample";
import { baseDemoSample } from "../../utils/view-sample";
import type { DataSourceStore } from "../dataSourceStore";


const VIS_SUBSET_LIMIT = 400;
const SAMPLE_UPDATE_DELAY = 500;


export default class CausalDatasetStore {

    public datasetId: string | null;

    public allFields: readonly IFieldMeta[] = [];

    protected fieldIndices$ = new Subject<readonly number[]>();
    /** All fields to analyze */
    public fields: readonly IFieldMeta[] = [];

    protected filters$ = new Subject<readonly IFilter[]>();
    public filters: readonly IFilter[] = [];

    public fullDataSize = 0;
    public filteredDataSize = 0;
    public sampleSize = 0;

    protected _sampleRate: number = 1;
    public get sampleRate() {
        return this._sampleRate;
    }
    public set sampleRate(value: number) {
        this._sampleRate = Math.max(0, Math.min(1, value));
    }

    protected filteredData: IteratorStorage;
    /**
     * Rows used to do analysis.
     * Never use it to decide a distinguishing because it will never changes.
     * In view, use `visSample` instead.
     */
    public sample: IteratorStorage;
    public readonly sampleMetaInfo$: Observable<IteratorStorageMetaInfo>;
    /** Rows used to render sub charts */
    public visSample: readonly IRow[] = [];

    public readonly destroy: () => void;

    constructor(dataSourceStore: DataSourceStore) {
        this.filteredData = new IteratorStorage({ itemKey: 'causalStoreFilteredData' });
        this.sample = new IteratorStorage({ itemKey: 'causalStoreSample' });

        const allFields$ = new Subject<IFieldMeta[]>();
        const fields$ = new Subject<IFieldMeta[]>();
        const fullDataChangedSignal$ = new Subject<1>();
        const sampleRate$ = new Subject<number>();
        
        makeAutoObservable(this, {
            allFields: observable.ref,
            fields: observable.ref,
            filters: observable.ref,
            // @ts-expect-error non-public field
            filteredData: false,
            sample: false,
            sampleMetaInfo$: false,
            visSample: observable.ref,
            destroy: false,
        });

        const filteredDataMetaInfo$ = combineLatest({
            _: fullDataChangedSignal$,
            filters: this.filters$,
        }).pipe(
            map(({ filters }) => {
                return from(filterDataService({
                    computationMode: 'inline',
                    dataSource: dataSourceStore.cleanedData,
                    extData: new Map<string, ICol<any>>(),
                    filters: toJS(filters) as IFilter[],
                    fields: this.allFields,
                }).then(r => {
                    return this.filteredData.setAll(r.rows);
                }).then(() => {
                    return this.filteredData.syncMetaInfoFromStorage();
                }))
            }),
            switchAll(),
            share()
        );

        this.sampleMetaInfo$ = combineLatest({
            filteredDataMetaInfo: filteredDataMetaInfo$,
            sampleRate: sampleRate$.pipe(throttleTime(SAMPLE_UPDATE_DELAY)),
            fields: fields$,
        }).pipe(
            map(({ sampleRate, fields }) => {
                const fullData = this.filteredData.getAll();
                return from(
                    fullData.then(rows => {
                        const indices = focusedSample(rows, fields, sampleRate * rows.length);
                        return indices.map(idx => rows[idx]);
                    }).then(rows => {
                        return this.sample.setAll(rows);
                    }).then(() => {
                        return this.sample.syncMetaInfoFromStorage();
                    })
                );
            }),
            switchAll(),
            share()
        );

        const visSample$ = this.sampleMetaInfo$.pipe(
            map(() => {
                const fullData = this.sample.getAll();
                return from(
                    fullData.then(rows => {
                        return baseDemoSample(rows, VIS_SUBSET_LIMIT);
                    })
                );
            }),
            switchAll(),
            share()
        );

        const mobxReactions = [
            reaction(() => dataSourceStore.datasetId, id => {
                runInAction(() => {
                    this.datasetId = id;
                });
                this.filters$.next([]);
            }),
            reaction(() => dataSourceStore.cleanedData, cleanedData => {
                fullDataChangedSignal$.next(1);
                runInAction(() => {
                    this.fullDataSize = cleanedData.length;
                });
            }),
            reaction(() => dataSourceStore.fieldMetas, fieldMetas => {
                allFields$.next(fieldMetas);
            }),
            reaction(() => this.sampleRate, sr => {
                sampleRate$.next(sr);
            }),
        ];

        const rxReactions = [
            // reset field selector
            allFields$.subscribe(fields => {
                runInAction(() => {
                    this.allFields = fields;
                });
                // Choose the first 10 fields by default
                this.fieldIndices$.next(fields.slice(0, 10).map((_, i) => i));
            }),

            // compute `fields`
            this.fieldIndices$.subscribe((fieldIndices) => {
                fields$.next(fieldIndices.map(index => this.allFields[index]));
            }),

            // bind `fields` with observer
            fields$.subscribe(fields => {
                runInAction(() => {
                    this.fields = fields;
                });
            }),

            // assign filters
            this.filters$.subscribe(filters => {
                runInAction(() => {
                    this.filters = filters;
                });
            }),

            // update filteredData info
            filteredDataMetaInfo$.subscribe(meta => {
                runInAction(() => {
                    this.filteredDataSize = meta.length;
                });
            }),

            // update sample info
            this.sampleMetaInfo$.subscribe(meta => {
                runInAction(() => {
                    this.sampleSize = meta.length;
                });
            }),

            // update `visSample`
            visSample$.subscribe(data => {
                runInAction(() => {
                    this.visSample = data;
                });
            }),
        ];

        // initialize data
        this.datasetId = dataSourceStore.datasetId;
        allFields$.next(dataSourceStore.fieldMetas);
        sampleRate$.next(this.sampleRate);
        fullDataChangedSignal$.next(1);
        this.filters$.next([]);

        this.destroy = () => {
            mobxReactions.forEach(dispose => dispose());
            rxReactions.forEach(subscription => subscription.unsubscribe());
        };
    }

    public selectFields(indices: readonly number[]) {
        this.fieldIndices$.next(indices);
    }

    public appendFilter(filter: IFilter) {
        this.filters$.next(this.filters.concat([filter]));
    }

    public removeFilter(index: number) {
        this.filters$.next(produce(this.filters, draft => {
            draft.splice(index, 1);
        }));
    }

}
