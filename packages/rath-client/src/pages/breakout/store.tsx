import { IFilter } from "@kanaries/loa";
import { makeAutoObservable, observable } from "mobx";
import { createContext, memo, useContext, useMemo } from "react";
import type { DataSourceStore } from "../../store/dataSourceStore";


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

export class BreakoutStore {

    public readonly dataSourceStore: DataSourceStore;

    public compareTarget: CompareTarget | null;

    public compareBase: (
        | { type: 'other' }
        | { type: 'filter'; filter: FilterRule }
    );

    constructor(dataSourceStore: DataSourceStore) {
        this.dataSourceStore = dataSourceStore;
        this.compareTarget = null;
        this.compareBase = { type: 'other' };
        makeAutoObservable(this, {
            compareTarget: observable.shallow,
            dataSourceStore: false,
        });
    }

    public setCompareTarget(compareTarget: CompareTarget | null) {
        this.compareTarget = compareTarget;
    }

}


const BreakoutContext = createContext<BreakoutStore>(null!);

export const useBreakoutContext = (dataSourceStore: DataSourceStore) => {
    const store = useMemo(() => new BreakoutStore(dataSourceStore), [dataSourceStore]);
    const context = useContext(BreakoutContext);

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
