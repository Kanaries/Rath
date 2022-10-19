import { IRow } from "@kanaries/loa";
import { useCallback, useEffect, useRef, useState } from "react";

function cloneDataSource (data: IRow[]): IRow[] {
    return data.map(d => ({...d}));
}

export function useViewData (dataSource: IRow[]) {
    const viewDataRef = useRef<IRow[]>([]);
    const [trigger, setTrigger] = useState<number>(0);
    
    const forceUpdate = useCallback(() => {
        setTrigger(v => (v + 1) % 10000)
    }, [])

    const setViewData = useCallback((data: IRow[]) => {
        viewDataRef.current = data;
        forceUpdate();
    }, [forceUpdate])

    const maintainViewDataChange = useCallback((data: IRow[]) => {
        viewDataRef.current = data;
    }, [])

    const maintainViewDataRemove = useCallback((condition: (r: IRow) => boolean) => {
        const nextData = [];
        for (let i = 0; i < viewDataRef.current.length; i++) {
            if (!condition(viewDataRef.current[i])) {
                nextData.push(viewDataRef.current[i])
            }
        }
        viewDataRef.current = nextData
    }, [])

    useEffect(() => {
        viewDataRef.current = cloneDataSource(dataSource);
        forceUpdate();
    }, [dataSource, forceUpdate])

    const initViewData = useCallback(() => {
        viewDataRef.current = cloneDataSource(dataSource);
        forceUpdate()
    }, [forceUpdate, dataSource])

    const viewData = viewDataRef.current;

    return {
        maintainViewDataChange,
        maintainViewDataRemove,
        setViewData,
        viewData,
        initViewData,
        trigger
    };
}