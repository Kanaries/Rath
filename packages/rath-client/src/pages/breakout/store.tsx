import type { IFieldMeta, IFilter, IRow } from "@kanaries/loa";
import { makeAutoObservable, observable, reaction, runInAction } from "mobx";
import { createContext, memo, useContext, useEffect, useMemo } from "react";
import type { Aggregator } from "../../global";
import type { DataSourceStore } from "../../store/dataSourceStore";
import { resolveCompareTarget } from "./components/controlPanel";
import { applyDividers, FieldStats, statDivision } from "./utils/stats";
import { analyzeComparisons, analyzeContributions, ISubgroupResult } from "./utils/top-drivers";


export type IUniqueFilter = IFilter & { id: string };
export type IExportFilter = IFilter & Pick<IFieldMeta, 'name' | 'semanticType' | 'distribution'>;

export const NumericalMetricAggregationTypes = [
    'mean',
    'sum',
    'count',
    // MetricAggregationType.WeightedAverage,
    // MetricAggregationType.NumericalRate,
] as const;

export const CategoricalMetricAggregationTypes = [
    // MetricAggregationType.C_Rate,
    // MetricAggregationType.C_Count,
] as const;

export type BreakoutMainField = {
    fid: string;
    aggregator: Aggregator;
};

export type BreakoutMainFieldExport = BreakoutMainField & Pick<IFieldMeta, 'name' | 'semanticType' | 'distribution'>;

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
                distribution: field.distribution,
            });
        }
    }
    return result;
};

export class BreakoutStore {

    public readonly dataSourceStore: DataSourceStore;

    public mainField: Readonly<BreakoutMainField> | null;

    public mainFieldFilters: IFilter[];
    
    public comparisonFilters: IFilter[];

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
        this.mainField = null;
        this.mainFieldFilters = [];
        this.comparisonFilters = [];
        this.selection = dataSourceStore.cleanedData;
        this.diffGroup = [];
        this.globalStats = null;
        this.selectionStats = null;
        this.diffStats = null;
        this.generalAnalyses = [];
        this.comparisonAnalyses = [];
        makeAutoObservable(this, {
            mainField: observable.ref,
            mainFieldFilters: observable.ref,
            comparisonFilters: observable.ref,
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
        const updateSelection = (
            mainField: Readonly<BreakoutMainField> | null,
            mainFieldFilters: Readonly<IFilter[]>,
            comparisonFilters: Readonly<IFilter[]>,
        ) => {
            const fieldMetas = this.dataSourceStore.fieldMetas;
            const targetField = mainField ? resolveCompareTarget(mainField, fieldMetas) : null;
            let globalStats: typeof this['globalStats'] = null;
            if (mainField && targetField) {
                globalStats = {
                    definition: mainField,
                    field: targetField.field,
                    stats: statDivision(this.totalData, this.totalData, fieldMetas, targetField.field.fid),
                };
            }
            runInAction(() => {
                this.globalStats = globalStats;
            });
            
            runInAction(() => {
                const [filtered] = applyDividers(this.totalData, mainFieldFilters);
                this.selection = filtered;
                const targetField = this.mainField ? resolveCompareTarget(this.mainField, fieldMetas) : null;
                if (this.mainField && targetField && mainFieldFilters.length > 0) {
                    this.selectionStats = {
                        definition: this.mainField,
                        field: targetField.field,
                        stats: statDivision(this.totalData, filtered, fieldMetas, this.mainField.fid),
                    };
                } else {
                    this.selectionStats = null;
                }
            });
            runInAction(() => {
                if (!mainField || !globalStats) {
                    this.generalAnalyses = [];
                    this.comparisonAnalyses = [];
                } else {
                    this.generalAnalyses = analyzeContributions(
                        this.selection,
                        fieldMetas,
                        mainField,
                        globalStats.stats[mainField.aggregator],
                    );
                }
            });
            runInAction(() => {
                if (!this.mainField || !targetField || comparisonFilters.length === 0) {
                    this.diffGroup = [];
                    this.diffStats = null;
                    this.comparisonAnalyses = [];
                } else {
                    const [filtered] = applyDividers(this.totalData, comparisonFilters);
                    this.diffGroup = filtered;
                    this.diffStats = {
                        definition: this.mainField,
                        field: targetField.field,
                        stats: statDivision(this.totalData, filtered, fieldMetas, this.mainField.fid),
                    };
                    this.comparisonAnalyses = analyzeComparisons(
                        this.selection,
                        this.diffGroup,
                        fieldMetas,
                        this.mainField,
                    );
                }
            });
        };
        reaction(() => this.mainField, mainField => {
            // FIXME: data & fieldMetas also reactive
            updateSelection(mainField, this.mainFieldFilters, this.comparisonFilters);
        });
        reaction(() => this.mainFieldFilters, mainFieldFilters => {
            updateSelection(this.mainField, mainFieldFilters, this.comparisonFilters);
        });
        reaction(() => this.comparisonFilters, comparisonFilters => {
            updateSelection(this.mainField, this.mainFieldFilters, comparisonFilters);
        });
    }

    public destroy() {
        // TODO: clear side effect
    }

    public export(): BreakoutStoreExports {
        const { fieldMetas } = this.dataSourceStore;
        const main = this.mainField ? resolveCompareTarget(this.mainField, fieldMetas) : null;
        return {
            mainField: main ? {
                ...this.mainField!,
                name: main.field.name,
                semanticType: main.field.semanticType,
                distribution: main.field.distribution,
            } : null,
            mainFieldFilters: exportFilters(this.mainFieldFilters, fieldMetas),
            comparisonFilters: exportFilters(this.comparisonFilters, fieldMetas),
        };
    }

    public setMainField(mainField: Readonly<BreakoutMainField> | null) {
        this.mainField = mainField;
    }

    public setMainFieldFilters(mainFieldFilters: IFilter[]) {
        this.mainFieldFilters = mainFieldFilters;
    }

    public setComparisonFilters(comparisonFilters: IFilter[]) {
        this.comparisonFilters = comparisonFilters;
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
