import { createContext, FC, useContext, useMemo, createElement, useEffect, useCallback } from "react";
import type { DataSourceStore } from "../dataSourceStore";


class CausalViewStore {

    public readonly dataSourceStore: DataSourceStore;

    public destroy() {}

    constructor(dataSourceStore: DataSourceStore) {
        this.dataSourceStore = dataSourceStore;
    }

}


const CausalViewContext = createContext<CausalViewStore | null>(null);

export const useCausalViewProvider = (dataSourceStore: DataSourceStore): FC => {
    const context = useMemo(() => new CausalViewStore(dataSourceStore), [dataSourceStore]);

    useEffect(() => {
        const ref = context;
        return () => {
            ref.destroy();
        };
    }, [context]);

    return useCallback(function CausalViewProvider ({ children }) {
        return createElement(CausalViewContext.Provider, { value: context }, children);
    }, [context]);
};

export const useCausalViewContext = () => useContext(CausalViewContext);
