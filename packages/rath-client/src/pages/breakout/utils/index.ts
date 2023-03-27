import { useEffect } from "react";
import { IBreakoutPageProps } from "..";
import type { BreakoutStore } from "../store";

export const arrayEquals = (a: unknown[], b: unknown[]) => {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
};

export const useDefaultConfigs = (store: BreakoutStore, configs: Readonly<IBreakoutPageProps>): void => {
    const { defaultMainField, defaultMainFieldFilters, defaultComparisonFilters } = configs;

    useEffect(() => {
        if (defaultMainField !== undefined) {
            store.setMainField(defaultMainField);
        }
    }, [defaultMainField, store]);

    useEffect(() => {
        if (defaultMainFieldFilters !== undefined) {
            store.setComparisonFilters(defaultMainFieldFilters);
        }
    }, [defaultMainFieldFilters, store]);

    useEffect(() => {
        if (defaultComparisonFilters !== undefined) {
            store.setComparisonFilters(defaultComparisonFilters);
        }
    }, [defaultComparisonFilters, store]);
};
