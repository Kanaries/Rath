import type { IFilter, IRow } from "@kanaries/loa";
import { makeAutoObservable, observable, reaction, runInAction } from "mobx";
import { createContext, memo, useContext, useEffect, useMemo } from "react";
import type { DataSourceStore } from "../../store/dataSourceStore";
import { resolveCompareTarget } from "./components/controlPanel";
import { flatFilterRules } from "./components/metricFilter";
import { applyDividers, FieldStats, statDivision } from "./utils/stats";
import { analyzeComparisons, analyzeContributions, ISubgroupResult } from "./utils/top-drivers";


export type IUniqueFilter = IFilter & { id: string };

export type FilterRule = (
    | { when: IUniqueFilter }
    | { not: IUniqueFilter }
) & (
    | { and?: FilterRule }
    | { or?: FilterRule }
);

export enum MetricAggregationType {
    Average = "average",
    Sum = "sum",
    Count = "count",
    WeightedAverage = "weighted_average",
    NumericalRate = "numerical_rate",
    C_Rate = "c-rate",
    C_Count = "c-count",
}

export const NumericalMetricAggregationTypes = [
    MetricAggregationType.Average,
    MetricAggregationType.Sum,
    MetricAggregationType.Count,
    MetricAggregationType.WeightedAverage,
    MetricAggregationType.NumericalRate,
] as const;

export const CategoricalMetricAggregationTypes = [
    MetricAggregationType.C_Rate,
    MetricAggregationType.C_Count,
] as const;

export type CompareTarget = {
    fid: string;
    aggregate: MetricAggregationType;
    metric: FilterRule | null;
};

export type CompareBase = FilterRule;

export class BreakoutStore {

    public readonly dataSourceStore: DataSourceStore;

    public compareTarget: Readonly<CompareTarget> | null;

    public compareBase: Readonly<CompareBase> | null;

    public get totalData() {
        return this.dataSourceStore.cleanedData;
    }
    public selection: readonly IRow[];
    public diffGroup: readonly IRow[];

    public globalStats: FieldStats | null;
    public selectionStats: FieldStats | null;
    public diffStats: FieldStats | null;

    public generalAnalyses: ISubgroupResult[];
    public comparisonAnalyses: ISubgroupResult[];
    
    constructor(dataSourceStore: DataSourceStore) {
        this.dataSourceStore = dataSourceStore;
        this.compareTarget = null;
        this.compareBase = null;
        this.selection = dataSourceStore.cleanedData;
        this.diffGroup = [];
        this.globalStats = null;
        this.selectionStats = null;
        this.diffStats = null;
        this.generalAnalyses = [];
        this.comparisonAnalyses = [];
        makeAutoObservable(this, {
            compareTarget: observable.ref,
            selection: observable.ref,
            diffGroup: observable.ref,
            globalStats: observable.ref,
            selectionStats: observable.ref,
            diffStats: observable.ref,
            generalAnalyses: observable.ref,
            comparisonAnalyses: observable.ref,
            dataSourceStore: false,
        });
        // TODO: collect effect
        // TODO: use rxjs
        const updateSelection = (compareTarget: Readonly<CompareTarget> | null, compareBase: Readonly<CompareBase> | null) => {
            const fieldMetas = this.dataSourceStore.fieldMetas;
            const targetField = compareTarget ? resolveCompareTarget(compareTarget, fieldMetas) : null;
            let globalStats: typeof this['globalStats'] = null;
            if (compareTarget && targetField) {
                globalStats = {
                    definition: compareTarget,
                    field: targetField.field,
                    stats: statDivision(this.totalData, this.totalData, fieldMetas, targetField.field.fid),
                };
            }
            runInAction(() => {
                this.globalStats = globalStats;
            });
            
            const filters = flatFilterRules(compareTarget?.metric ?? null);
            runInAction(() => {
                const [filtered] = applyDividers(this.totalData, filters);
                this.selection = filtered;
                const targetField = this.compareTarget ? resolveCompareTarget(this.compareTarget, fieldMetas) : null;
                if (this.compareTarget && targetField && compareTarget?.metric) {
                    this.selectionStats = {
                        definition: this.compareTarget,
                        field: targetField.field,
                        stats: statDivision(this.totalData, filtered, fieldMetas, this.compareTarget.fid),
                    };
                } else {
                    this.selectionStats = null;
                }
            });
            runInAction(() => {
                if (!compareTarget || !globalStats) {
                    this.generalAnalyses = [];
                    this.comparisonAnalyses = [];
                } else {
                    this.generalAnalyses = analyzeContributions(
                        this.selection,
                        fieldMetas,
                        compareTarget,
                        globalStats.stats[compareTarget.aggregate],
                    );
                }
            });
            runInAction(() => {
                if (!this.compareTarget || !targetField || !compareBase) {
                    this.diffGroup = [];
                    this.diffStats = null;
                    this.comparisonAnalyses = [];
                } else {
                    const filters = flatFilterRules(compareBase);
                    const [filtered] = applyDividers(this.totalData, filters);
                    this.diffGroup = filtered;
                    this.diffStats = {
                        definition: this.compareTarget,
                        field: targetField.field,
                        stats: statDivision(this.totalData, filtered, fieldMetas, this.compareTarget.fid),
                    };
                    this.comparisonAnalyses = analyzeComparisons(
                        this.selection,
                        this.diffGroup,
                        fieldMetas,
                        this.compareTarget,
                    );
                }
            });
        };
        reaction(() => this.compareTarget, compareTarget => {
            // FIXME: data & fieldMetas also reactive
            updateSelection(compareTarget, this.compareBase);
        });
        reaction(() => this.compareBase, compareBase => {
            updateSelection(this.compareTarget, compareBase);
        });
    }

    public destroy() {
        // TODO: clear side effect
    }

    public setCompareTarget(compareTarget: Readonly<CompareTarget> | null) {
        this.compareTarget = compareTarget;
    }

    public setCompareBase(compareBase: Readonly<CompareBase> | null) {
        this.compareBase = compareBase;
    }

}

const BreakoutContext = createContext<BreakoutStore>(null!);

export const useBreakoutContext = (dataSourceStore: DataSourceStore) => {
    const store = useMemo(() => new BreakoutStore(dataSourceStore), [dataSourceStore]);
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

export const useBreakoutStore = () => {
    const store = useContext(BreakoutContext);
    return store;
};
