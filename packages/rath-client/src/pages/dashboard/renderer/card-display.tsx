import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import { FC, useCallback, useEffect } from "react";
import type { IFilter } from "../../../interfaces";
import type { CardProviderProps } from "./card";


const CardDisplay: FC<CardProviderProps> = ({ children, item }) => {
    const { chart } = item.content;

    useEffect(() => {
        if (chart) {
            runInAction(() => {
                chart.highlighter = [];
            });
            return () => {
                runInAction(() => {
                    chart.highlighter = [];
                });
            };
        }
    }, [chart]);

    const handleFilter = useCallback((filters: Readonly<IFilter[]>) => {
        if (chart) {
            runInAction(() => {
                chart.highlighter = [...filters];
            });
        }
    }, [chart]);

    return children({
        onFilter: handleFilter,
    });
};


export default observer(CardDisplay);
