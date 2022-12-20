import { observer } from 'mobx-react-lite';
import { FC, useCallback, useEffect } from 'react';
import type { IFilter } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import type { CardProviderProps } from './card';

const CardDisplay: FC<CardProviderProps> = ({ children, item }) => {
    const { dashboardStore } = useGlobalStore();
    const { chart } = item.content;

    useEffect(() => {
        if (chart) {
            dashboardStore.runInAction(() => {
                chart.highlighter = [];
            });
            return () => {
                dashboardStore.runInAction(() => {
                    chart.highlighter = [];
                });
            };
        }
    }, [dashboardStore, chart]);

    const handleFilter = useCallback(
        (filters: Readonly<IFilter[]>) => {
            if (chart) {
                dashboardStore.runInAction(() => {
                    chart.highlighter = [...filters];
                });
            }
        },
        [dashboardStore, chart]
    );

    return children({
        onFilter: handleFilter,
    });
};

export default observer(CardDisplay);
