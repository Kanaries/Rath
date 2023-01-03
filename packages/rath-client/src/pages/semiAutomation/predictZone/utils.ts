import { useEffect, useMemo, useState } from "react";
import { map, Subject, switchAll } from "rxjs";
import type { IRow, IVegaSubset } from "../../../interfaces";
import { distVis } from "../../../queries/distVis";
import { labDistVisService } from "../../../services";
import { useGlobalStore } from "../../../store";


export const useAsyncViews = (task: Promise<IVegaSubset[]>): IVegaSubset[] => {
    const [list, setList] = useState<IVegaSubset[]>([]);
    const asyncSpec$ = useMemo(() => new Subject<Promise<typeof list> | typeof list>(), []);
    useEffect(() => {
        const syncSpec$ = asyncSpec$.pipe(
            map(val => Promise.resolve(val)),
            switchAll()
        );
        const subscription = syncSpec$.subscribe(val => setList(val));
        return () => {
            subscription.unsubscribe();
        };
    }, [asyncSpec$]);
    useEffect(() => {
        asyncSpec$.next([]);
        asyncSpec$.next(task);
        return () => {
            asyncSpec$.next([]);
        };
    }, [task, asyncSpec$]);
    return list;
};

export const useVisSpec = (props: Parameters<typeof distVis>[0], dataSource: IRow[]): IVegaSubset | null => {
    const { semiAutoStore } = useGlobalStore();
    const { settings: { vizAlgo } } = semiAutoStore;

    const [spec, setSpec] = useState<IVegaSubset | null>(null);
    const asyncSpec$ = useMemo(() => new Subject<Promise<typeof spec> | typeof spec>(), []);
    useEffect(() => {
        const syncSpec$ = asyncSpec$.pipe(
            map(val => Promise.resolve(val)),
            switchAll()
        );
        const subscription = syncSpec$.subscribe(val => setSpec(val));
        return () => {
            subscription.unsubscribe();
        };
    }, [asyncSpec$]);
    useEffect(() => {
        asyncSpec$.next(null);
        if (vizAlgo === 'lite') {
            asyncSpec$.next(distVis(props));
        } else {
            asyncSpec$.next(labDistVisService({ dataSource, ...props }));
        }
    }, [vizAlgo, props, dataSource, asyncSpec$]);

    return spec;
};
