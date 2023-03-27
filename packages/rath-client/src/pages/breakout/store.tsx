import type { IFieldMeta, IFilter, IRow } from "@kanaries/loa";
import { makeAutoObservable, observable } from "mobx";
import { createContext, memo, useContext, useEffect, useMemo } from "react";
import { combineLatest, map, throttleTime, type Observable } from "rxjs";
import type { Aggregator } from "../../global";
import { toStream } from "../../utils/mobx-utils";
import { resolveCompareTarget } from "./components/controlPanel";
import { applyDividers, FieldStats, statDivision } from "./utils/stats";
import { analyzeComparisons, analyzeContributions, ISubgroupResult } from "./utils/top-drivers";
import type { IBreakoutPageProps } from ".";


type Observed<T> = T extends Observable<infer U> ? U : never;

export type IUniqueFilter = IFilter & { id: string };
export type IExportFilter = IFilter & Pick<IFieldMeta, 'name' | 'semanticType'>;


type IFieldShort = Pick<Required<NonNullable<IFieldMeta>>, 'fid' | 'name' | 'semanticType' | 'analyticType' | 'geoRole'>;

interface ISearchAIPayload {
    metas: IFieldShort[];
    query: string;
    model: 'accuracy';
}

const searchAIApiUrl = 'https://enhanceai.kanaries.net/api/rootcausal';

export const NumericalMetricAggregationTypes: readonly Aggregator[] = [
    'mean',
    'sum',
    'count',
];

export const CategoricalMetricAggregationTypes: readonly Aggregator[] = [
    // MetricAggregationType.C_Rate,
    // MetricAggregationType.C_Count,
];

export type BreakoutMainField = {
    fid: string;
    aggregator: Aggregator;
};

export type BreakoutMainFieldExport = BreakoutMainField & Pick<IFieldMeta, 'name' | 'semanticType'>;

export type BreakoutStoreExports = {
    mainField: BreakoutMainFieldExport | null;
    mainFieldFilters: IExportFilter[];
    comparisonFilters: IExportFilter[];
};

const exportFilters = (filters: IFilter[], fieldMetas: IFieldMeta[]): IExportFilter[] => {
    const result: IExportFilter[] = [];
    for (const filter of filters) {
        const field = fieldMetas.find(f => f.fid === filter.fid);
        if (field) {
            result.push({
                ...filter,
                name: field.name,
                semanticType: field.semanticType,
            });
        }
    }
    return result;
};

class BreakoutStore {

    public readonly fields: IFieldMeta[];

    public mainField: Readonly<BreakoutMainField> | null;

    public mainFieldFilters: IFilter[];
    
    public comparisonFilters: IFilter[];

    public globalStats: FieldStats | null;
    public selectionStats: FieldStats | null;
    public diffStats: FieldStats | null;

    public generalAnalyses: ISubgroupResult[];
    public comparisonAnalyses: ISubgroupResult[];

    public focusedSubgroupFid: string;
    
    constructor(data: IRow[], fields: IFieldMeta[]) {
        this.fields = fields;
        this.mainField = null;
        this.mainFieldFilters = [];
        this.comparisonFilters = [];
        this.globalStats = null;
        this.selectionStats = null;
        this.diffStats = null;
        this.generalAnalyses = [];
        this.comparisonAnalyses = [];
        this.focusedSubgroupFid = '';
        makeAutoObservable(this, {
            destroy: false,
            fields: false,
            mainField: observable.ref,
            mainFieldFilters: observable.ref,
            comparisonFilters: observable.ref,
            globalStats: observable.ref,
            selectionStats: observable.ref,
            diffStats: observable.ref,
            generalAnalyses: observable.ref,
            comparisonAnalyses: observable.ref,
        });
        const mainField$ = toStream(() => this.mainField, true);
        const mainFieldFilters$ = toStream(() => this.mainFieldFilters, true);
        const comparisonFilters$ = toStream(() => this.comparisonFilters, true);

        const inputFlow$ = combineLatest({
            mainField: mainField$,
            mainFieldFilters: mainFieldFilters$,
            comparisonFilters: comparisonFilters$,
        });

        const global$ = inputFlow$.pipe(
            throttleTime(200, undefined, { leading: true, trailing: true }),
            map(input => {
                const { mainField } = input;
                const targetField = mainField ? resolveCompareTarget(mainField, fields) : null;
                let globalStats: typeof this['globalStats'] = null;
                if (mainField && targetField) {
                    globalStats = {
                        definition: mainField,
                        field: targetField.field,
                        stats: statDivision(data, data, fields, targetField.field.fid),
                    };
                }
                return {
                    ...input,
                    targetField,
                    globalStats,
                };
            })
        );

        const mainGroup$ = global$.pipe(
            map(({ mainField, mainFieldFilters, targetField, globalStats }) => {
                const [filtered] = applyDividers(data, mainFieldFilters);
                const selection = filtered;
                let stats: FieldStats | null = null;
                if (mainField && targetField && mainFieldFilters.length > 0) {
                    stats = {
                        definition: mainField,
                        field: targetField.field,
                        stats: statDivision(data, filtered, fields, mainField.fid),
                    };
                }
                return { data: selection, stats, mainField, globalStats };
            })
        );

        const generalAnalyses$ = mainGroup$.pipe(
            map<Observed<typeof mainGroup$>, ISubgroupResult[]>(({ data, globalStats, mainField }) => {
                if (!mainField || !globalStats) {
                    return [];
                }
                return analyzeContributions(
                    data,
                    fields,
                    mainField,
                    globalStats.stats[mainField.aggregator],
                );
            })
        );

        const compareGroup$ = global$.pipe(
            map<Observed<typeof global$>, { data: readonly IRow[]; stats: FieldStats | null }>(({ mainField, comparisonFilters, globalStats }) => {
                if (!mainField || !globalStats || comparisonFilters.length === 0) {
                    return {
                        data: [],
                        stats: null,
                    };
                }
                const [filtered] = applyDividers(data, comparisonFilters);
                const stats: FieldStats = {
                    definition: mainField,
                    field: resolveCompareTarget(mainField, fields)!.field,
                    stats: statDivision(data, filtered, fields, mainField.fid),
                };
                return { data: filtered, stats };
            })
        );

        const comparisonBase$ = combineLatest({
            mainGroup: mainGroup$,
            compareGroup: compareGroup$,
            global: global$,
        });

        const comparisonAnalyses$ = comparisonBase$.pipe(
            map<Observed<typeof comparisonBase$>, ISubgroupResult[]>(({ mainGroup, compareGroup, global }) => {
                const { data: population } = mainGroup;
                const { mainField, comparisonFilters } = global;
                if (!mainField || comparisonFilters.length === 0) {
                    return [];
                }
                return analyzeComparisons(
                    population,
                    compareGroup.data,
                    fields,
                    mainField,
                );
            })
        );

        const subscriptions = [
            // update global stats
            global$.subscribe(({ globalStats }) => {
                this.updateGlobalStats(globalStats);
            }),
            // reset comparison filters
            mainFieldFilters$.subscribe(filters => {
                if (filters.length === 0) {
                    this.setComparisonFilters([]);
                }
            }),
            // update main group stats
            mainGroup$.subscribe(({ stats }) => {
                this.updateMainGroupStats(stats);
            }),
            // analyze contributions
            generalAnalyses$.subscribe(analysis => {
                this.updateGeneralAnalyses(analysis);
            }),
            // update comparison group stats
            compareGroup$.subscribe(({ stats }) => {
                this.updateComparisonGroupStats(stats);
            }),
            // update comparison group analyses
            comparisonAnalyses$.subscribe(analyses => {
                this.updateComparisonAnalyses(analyses);
            }),
        ];

        this.destroy = () => {
            for (const subscription of subscriptions) {
                subscription.unsubscribe();
            }
        };
    }

    public readonly destroy: () => void;

    public export(): BreakoutStoreExports {
        const main = this.mainField ? resolveCompareTarget(this.mainField, this.fields) : null;
        return {
            mainField: main ? {
                ...this.mainField!,
                name: main.field.name,
                semanticType: main.field.semanticType,
            } : null,
            mainFieldFilters: exportFilters(this.mainFieldFilters, this.fields),
            comparisonFilters: exportFilters(this.comparisonFilters, this.fields),
        };
    }

    public setMainField(mainField: Readonly<BreakoutMainField> | null) {
        if (!mainField) {
            this.mainField = null;
        } else {
            this.mainField = {
                fid: mainField.fid,
                aggregator: (['sum', 'mean', 'count'] as const).find(a => a === mainField.aggregator) ?? 'mean',
            };
        }
    }

    public setMainFieldFilters(mainFieldFilters: IFilter[]) {
        this.mainFieldFilters = mainFieldFilters;
    }

    public setComparisonFilters(comparisonFilters: IFilter[]) {
        this.comparisonFilters = comparisonFilters;
    }

    public focusSubgroup(fieldId: string) {
        this.focusedSubgroupFid = fieldId;
    }

    protected updateGlobalStats(stats: FieldStats | null) {
        this.globalStats = stats;
    }

    protected updateMainGroupStats(stats: FieldStats | null) {
        this.selectionStats = stats;
    }

    protected updateGeneralAnalyses(analysis: ISubgroupResult[]) {
        this.generalAnalyses = analysis;
    }

    protected updateComparisonGroupStats(stats: FieldStats | null) {
        this.diffStats = stats;
    }

    protected updateComparisonAnalyses(analysis: ISubgroupResult[]) {
        this.comparisonAnalyses = analysis;
        const firstFirstClassSubgroup = analysis.find(a => !a.path?.length);
        this.focusedSubgroupFid = firstFirstClassSubgroup?.field.fid ?? '';
    }

    public async searchAI(query: string): Promise<IBreakoutPageProps | null> {
        const payload: ISearchAIPayload = {
            metas: this.fields.map(f => ({
                fid: f.fid,
                name: f.name || f.fid,
                semanticType: f.semanticType,
                analyticType: f.analyticType,
                geoRole: 'none',
            })),
            query,
            model: 'accuracy',
        };
        const res = await fetch(searchAIApiUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        try {
            const data = await res.json() as (
                | {
                    success: true;
                    data: IBreakoutPageProps;
                }
                | {
                    success: false;
                    message: string;
                }
            );
            if (!data.success) {
                throw new Error(data.message);
            }
            return data.data;
        } catch (error) {
            console.error(error);
        }
        return null;
    }

}

/* Do not export the constructor */
export type { BreakoutStore };

const BreakoutContext = createContext<BreakoutStore>(null!);

export const useBreakoutContext = (data: IRow[], fields: IFieldMeta[]) => {
    const store = useMemo(() => new BreakoutStore(data, fields), [data, fields]);
    const context = useContext(BreakoutContext);

    useEffect(() => {
        return () => {
            store.destroy();
        };
    }, [store]);

    return useMemo(() => ({
        BreakoutProvider: memo(function BreakoutProvider ({ children }) {
            return (
                <BreakoutContext.Provider value={store}>
                    {children}
                </BreakoutContext.Provider>
            );
        }),
        value: context,
    }), [store, context]);
};

/** Make sure you have wrapped the component with a provider returned by `useBreakoutContext()`. */
export const useBreakoutStore = () => {
    const store = useContext(BreakoutContext);
    return store;
};
