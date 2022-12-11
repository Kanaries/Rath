import produce from "immer";
import { makeAutoObservable, observable, reaction, runInAction, toJS } from "mobx";
import { combineLatest, from, map, Observable, share, Subject, switchAll, throttleTime } from "rxjs";
import { getGlobalStore } from "..";
import type { IFieldMeta, IFilter, ICol, IRow } from "../../interfaces";
import { oneHot } from "../../pages/causal/exploration/whatIf/utils";
import { filterDataService } from "../../services";
import { IteratorStorage, IteratorStorageMetaInfo } from "../../utils/iteStorage";
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

    public groups: readonly Readonly<{
        root: string;
        children: string[];
        expanded: boolean;
    }>[] = [];

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

        const originFields$ = new Subject<IFieldMeta[]>();
        const allFields$ = new Subject<IFieldMeta[]>();
        const fields$ = new Subject<IFieldMeta[]>();
        const fullDataChangedSignal$ = new Subject<1>();
        const sampleRate$ = new Subject<number>();
        
        makeAutoObservable(this, {
            allFields: observable.ref,
            fields: observable.ref,
            filters: observable.ref,
            groups: observable.ref,
            // @ts-expect-error non-public field
            filteredData: false,
            sample: false,
            sampleMetaInfo$: false,
            visSample: observable.ref,
            destroy: false,
        });

        const expandedData = new IteratorStorage({ itemKey: 'causalStoreExpandedData' });

        const expandedDataMetaInfo$ = originFields$.pipe(
            map((originFields) => {
                return from(this.__unsafeExpandFieldsWithOneHotEncoding(
                    dataSourceStore.cleanedData,
                    originFields,
                ).then(([fields, rows]) => {
                    return Promise.all([fields, expandedData.setAll(rows)] as const);
                }).then(([fields]) => {
                    const allFields = originFields.concat(fields);
                    const groups: CausalDatasetStore['groups'][number][] = [];
                    for (const f of originFields) {
                        if (fields.some(which => which.extInfo.extFrom[0] === f.fid)) {
                            const group: typeof groups[number] = {
                                expanded: false,
                                root: f.fid,
                                children: [],
                            };
                            fields.filter(which => which.extInfo.extFrom[0] === f.fid).forEach(ef => {
                                group.children.push(ef.fid);
                            });
                            groups.push(group);
                        }
                    }
                    return Promise.all([allFields, expandedData.syncMetaInfoFromStorage(), groups] as const);
                }));
            }),
            switchAll(),
            share(),
        );

        const expandedFields$ = expandedDataMetaInfo$.pipe(
            map(([allFields, , groups]) => [allFields, groups] as const),
            share(),
        );

        const filteredDataMetaInfo$ = combineLatest({
            _: expandedFields$,
            filters: this.filters$,
            fields: allFields$,
        }).pipe(
            map(({ filters }) => {
                return from(filterDataService({
                    computationMode: 'offline',
                    dataStorage: expandedData,
                    resultStorage: this.filteredData,
                    extData: new Map<string, ICol<any>>(),
                    filters: toJS(filters) as IFilter[],
                }).then(() => {
                    return this.filteredData.syncMetaInfoFromStorage();
                }));
            }),
            switchAll(),
            share()
        );

        this.sampleMetaInfo$ = combineLatest({
            filteredDataMetaInfo: filteredDataMetaInfo$,
            sampleRate: sampleRate$.pipe(throttleTime(SAMPLE_UPDATE_DELAY, undefined, { leading: false, trailing: true })),
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
                originFields$.next(fieldMetas);
            }),
            reaction(() => this.sampleRate, sr => {
                sampleRate$.next(sr);
            }),
        ];

        const rxReactions = [
            // set fields
            expandedFields$.subscribe(([allFields, groups]) => {
                allFields$.next(allFields);
                runInAction(() => {
                    this.groups = groups;
                });
            }),
            
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
                    getGlobalStore().causalStore.operator.updateDataSource();
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

    protected async __unsafeExpandFieldsWithOneHotEncoding(
        rows: readonly IRow[], fields: readonly IFieldMeta[]
    ): Promise<[(IFieldMeta & Required<Pick<IFieldMeta, "extInfo">>)[], IRow[]]> {
        const targets: string[] = fields.filter(f => {
            return !f.extInfo && f.semanticType === 'nominal';
        }).map(f => f.fid);
        const [derivedFields, data] = await oneHot(rows, fields, targets);
        const nextFields: IFieldMeta[] = fields.slice();
        const derivation = new Map<string, string[]>();
        for (const f of derivedFields) {
            const from = f.extInfo.extFrom[0];
            const idx = nextFields.findIndex(which => which.fid === from);
            if (idx !== -1) {
                nextFields.splice(idx, 1);
            }
            derivation.set(from, (derivation.get(from) ?? []).concat([f.fid]));
            nextFields.push({
                ...f,
                distribution: [],
                features: {
                    entropy: -1,
                    maxEntropy: -1,
                    unique: -1,
                },
            });
        }

        return [derivedFields.map(f => ({
            ...f,
            features: {
                unique: -1,
                entropy: -1,
                maxEntropy: -1,
            },
            distribution: [],
        })), data];
    }

    public toggleExpand(f: Readonly<IFieldMeta>) {
        this.groups = produce(this.groups, draft => {
            const gAsRoot = draft.find(group => group.root === f.fid);
            if (gAsRoot) {
                if (!gAsRoot.expanded) {
                    gAsRoot.expanded = true;
                }
                return;
            }
            const gAsLeaf = draft.find(group => group.children.includes(f.fid));
            if (gAsLeaf) {
                if (gAsLeaf.expanded) {
                    gAsLeaf.expanded = false;
                }
                return;
            }
        });
    }

}
