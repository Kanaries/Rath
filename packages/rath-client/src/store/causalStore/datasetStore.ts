import { applyFilters } from "@kanaries/loa";
import produce from "immer";
import { makeAutoObservable, observable, reaction } from "mobx";
import { combineLatest, map, Subject, switchAll, withLatestFrom } from "rxjs";
import type { IFieldMeta, IRow, IFilter } from "../../interfaces";
import { focusedSample } from "../../utils/sample";
import { baseDemoSample } from "../../utils/view-sample";
import type { DataSourceStore } from "../dataSourceStore";


const VIS_SUBSET_LIMIT = 2_000;
const SAMPLE_UPDATE_DELAY = 500;


export default class CausalDatasetStore {

    public allFields: readonly IFieldMeta[] = [];

    protected fieldIndices$ = new Subject<readonly number[]>();
    /** All fields to analyze */
    public fields: readonly IFieldMeta[] = [];

    protected filters$ = new Subject<readonly IFilter[]>();
    public filters: readonly IFilter[] = [];

    public fullDataSize = 0;
    public filteredDataSize = 0;
    public sampleSize = 0;

    protected appliedSampleRate$ = new Subject<number>();
    protected _sampleRate: number = 1;
    public get sampleRate() {
        return this._sampleRate;
    }
    public set sampleRate(value: number) {
        this._sampleRate = Math.max(0, Math.min(1, value));
        this.appliedSampleRate$.next(this._sampleRate);
    }
    public shouldDisplaySampleSpinner = false;

    protected sampleIndices$ = new Subject<readonly number[]>();
    /** Rows used to do analysis */
    public sample: readonly IRow[] = [];
    /** Rows used to render sub charts */
    public visSample: readonly IRow[] = [];

    public readonly destroy: () => void;

    constructor(dataSourceStore: DataSourceStore) {
        const allFields$ = new Subject<IFieldMeta[]>();
        const fields$ = new Subject<IFieldMeta[]>();
        const fullData$ = new Subject<IRow[]>();
        const filteredData$ = new Subject<IRow[]>();

        const mobxReactions = [
            reaction(() => dataSourceStore.cleanedData, cleanedData => {
                fullData$.next(cleanedData);
                this.fieldIndices$.next([]);
                this.filters$.next([]);
                this.fullDataSize = cleanedData.length;
            }),
            reaction(() => dataSourceStore.fieldMetas, fieldMetas => {
                allFields$.next(fieldMetas);
                this.sampleIndices$.next([]);
            }),
        ];

        const delayedSampleRate$ = this.appliedSampleRate$.pipe(
            map(sampleRate => new Promise<number>(resolve => {
                setTimeout(() => resolve(sampleRate), SAMPLE_UPDATE_DELAY);
            })),
            switchAll(),
        );

        const rxReactions = [
            // reset field selector
            allFields$.subscribe(fields => {
                this.allFields = fields;
                // Choose the first 10 fields by default
                this.fieldIndices$.next(fields.slice(0, 10).map((_, i) => i));
            }),

            // compute `fields`
            this.fieldIndices$.subscribe((fieldIndices) => {
                fields$.next(fieldIndices.map(index => this.allFields[index]));
            }),

            // bind `fields` with observer
            fields$.subscribe(fields => {
                this.fields = fields;
            }),

            // apply filtering
            this.filters$.pipe(
                withLatestFrom(fullData$)
            ).subscribe(([filters, fullData]) => {
                filteredData$.next(filters.length ? applyFilters(fullData, filters.slice(0)) : fullData);
            }),

            // update filteredData info
            filteredData$.subscribe(data => {
                this.filteredDataSize = data.length;
            }),

            // apply sampling
            combineLatest({
                filteredData: filteredData$,
                sampleRate: delayedSampleRate$,
                fields: fields$,
            }).subscribe(({ filteredData, sampleRate, fields }) => {
                const indices = focusedSample(filteredData, fields, sampleRate * filteredData.length);
                this.sampleIndices$.next(indices);
            }),

            // compute `sample` & update sample info
            this.sampleIndices$.pipe(
                withLatestFrom(filteredData$)
            ).subscribe(([indices, filteredData]) => {
                this.sample = indices.map(index => filteredData[index]);
                this.sampleSize = this.sample.length;
            }),

            // apply vis sampling
            this.sampleIndices$.pipe(
                map(rows => {
                    const indices = baseDemoSample(rows as unknown as IRow[], VIS_SUBSET_LIMIT);
                    return indices as unknown as number[];
                }),
                withLatestFrom(filteredData$),
            ).subscribe(([indices, filteredData]) => {
                this.visSample = indices.map(index => filteredData[index]);
            }),
        ];

        // initialize data
        allFields$.next(dataSourceStore.fieldMetas);
        fullData$.next(dataSourceStore.cleanedData);
        
        makeAutoObservable(this, {
            allFields: observable.ref,
            fields: observable.ref,
            filters: observable.ref,
            sample: observable.ref,
            destroy: false,
        });

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
