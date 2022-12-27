import { useEffect, useState } from "react";
import type { IVegaSubset } from "../../../interfaces";


export const useAsyncViews = (task: Promise<IVegaSubset[]>): IVegaSubset[] => {
    const [list, setList] = useState<IVegaSubset[]>([]);
    useEffect(() => {
        setList([]);
        task.then(res => setList(res));
        return () => {
            setList([]);
        };
    }, [task]);
    return list;
};
