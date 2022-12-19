import produce from "immer";
import { makeAutoObservable, observable, reaction, runInAction, toJS } from "mobx";
import { combineLatest, from, map, Observable, share, Subject, switchAll, throttleTime } from "rxjs";
import { getGlobalStore } from "..";
import type { IFieldMeta, IFilter, ICol, IRow, IteratorStorageMetaInfo } from "../../interfaces";
import { oneHot } from "../../pages/causal/submodule/whatIf/utils";
import { filterDataService } from "../../services";
import { IteratorStorage } from "../../utils/iteStorage";
import { fromStream, StreamListener, toStream } from "../../utils/mobx-utils";
import { focusedSample } from "../../utils/sample";
import { baseDemoSample } from "../../utils/view-sample";
import type { DataSourceStore } from "../dataSourceStore";


const VIS_SUBSET_LIMIT = 400;
const SAMPLE_UPDATE_DELAY = 500;


export default class CausalDatasetStore {

    public datasetId: string | null;

    public allFields: readonly IFieldMeta[] = [];
    public allSelectableFields: readonly { field: number; children: readonly number[] }[] = [];

    protected fieldIndices: readonly number[] = [];
    protected fieldsRef: StreamListener<readonly IFieldMeta[]>;
    /** All fields to analyze */
    public get fields() {
        return this.fieldsRef.current;
    }

    public groups: readonly Readonly<{
        root: string;
        children: string[];
        expanded: boolean;
    }>[] = [];

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
    
    protected visSampleRef: StreamListener<readonly IRow[]>;
    /** Rows used to render sub charts */
    public get visSample() {
        return this.visSampleRef.current;
    }

    public readonly destroy: () => void;

    constructor(dataSourceStore: DataSourceStore) {
        this.filteredData = new IteratorStorage({ itemKey: 'causalStoreFilteredData' });
        this.sample = new IteratorStorage({ itemKey: 'causalStoreSample' });

        const originFields$ = new Subject<IFieldMeta[]>();
        const allFields$ = toStream(() => this.allFields, true);
        const fields$ = new Subject<IFieldMeta[]>();
        const sampleRate$ = toStream(() => this.sampleRate, true);
        const filters$ = toStream(() => this.filters, true);

        this.fieldsRef = fromStream(fields$);
        
        makeAutoObservable(this, {
            allFields: observable.ref,
            allSelectableFields: observable.ref,
            filters: observable.ref,
            groups: observable.ref,
            // @ts-expect-error non-public field
            filteredData: false,
            sample: false,
            sampleMetaInfo$: false,
            visSampleRef: false,
            fieldIndices: observable.ref,
            fieldsRef: false,
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
            filters: filters$,
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
        this.visSampleRef = fromStream(visSample$);

        const mobxReactions = [
            reaction(() => dataSourceStore.datasetId, id => {
                runInAction(() => {
                    this.datasetId = id;
                    this.filters = [];
                });
            }),
            reaction(() => dataSourceStore.cleanedData, cleanedData => {
                runInAction(() => {
                    this.fullDataSize = cleanedData.length;
                });
            }),
            reaction(() => dataSourceStore.fieldMetas, fieldMetas => {
                originFields$.next(fieldMetas);
            }),
            // compute `fields`
            reaction(() => this.fieldIndices, (fieldIndices) => {
                fields$.next(fieldIndices.map(index => [
                    this.allFields[this.allSelectableFields[index].field],
                    ...this.allSelectableFields[index].children.map(i => this.allFields[i]),
                ]).flat());
            }),
        ];

        const rxReactions = [
            // set fields
            expandedFields$.subscribe(([allFields, groups]) => {
                const allSelectableFields: { field: number; children: number[] }[] = [];
                for (let i = 0; i < allFields.length; i += 1) {
                    const field = allFields[i];
                    const gAsRoot = groups.find(grp => grp.root === field.fid);
                    if (gAsRoot) {
                        allSelectableFields.push({
                            field: i,
                            children: gAsRoot.children.map(fid => allFields.findIndex(f => f.fid === fid)),
                        });
                    } else if (!groups.some(grp => grp.children.some(fid => fid === field.fid))) {
                        allSelectableFields.push({
                            field: i,
                            children: [],
                        });
                    }
                }
                runInAction(() => {
                    this.allFields = allFields;
                    this.groups = groups;
                    this.allSelectableFields = allSelectableFields;
                    // Choose the first 10 fields by default
                    this.fieldIndices = allSelectableFields.slice(0, 10).map((_, i) => i);
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
        ];

        // initialize data
        this.datasetId = dataSourceStore.datasetId;

        this.destroy = () => {
            mobxReactions.forEach(dispose => dispose());
            rxReactions.forEach(subscription => subscription.unsubscribe());
        };
    }

    public selectFields(indices: readonly number[]) {
        this.fieldIndices = indices;
    }

    public appendFilter(filter: IFilter) {
        this.filters = this.filters.concat([filter]);
    }

    public removeFilter(index: number) {
        this.filters = produce(this.filters, draft => {
            draft.splice(index, 1);
        });
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

    public toggleFieldSelected(fid: string) {
        const index = this.allFields.findIndex(f => f.fid === fid);
        if (index === -1) {
            return;
        }
        const next = this.fieldIndices.slice();
        const pos = next.findIndex(idx => idx === index);
        if (pos === -1) {
            next.push(index);
        } else {
            next.splice(pos, 1);
        }
        this.fieldIndices = next;
    }

}
