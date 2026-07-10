import { observer } from "mobx-react-lite";
import { FC, useState } from "react";
import { RathIcon } from "../../../../components/icons";
import { Input } from "../../../../components/ui/input";
import HistoryList, { IHistoryListProps } from "./history-list";


const HistoryPanel: FC<Pick<IHistoryListProps, 'onDataLoaded' | 'onClose' | 'onLoadingFailed'>> = (
    { onDataLoaded, onClose, onLoadingFailed }
) => {
    const [search, setSearch] = useState('');

    return (
        <>
            <div className="relative my-[1em] mb-[1.6em]">
                <RathIcon name="Search" className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                    className="pl-8"
                    name="dataset_history_search"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                />
            </div>
            <HistoryList
                onDataLoaded={onDataLoaded}
                onLoadingFailed={onLoadingFailed}
                onClose={onClose}
                search={search}
                groupByPeriod
            />
        </>
    );
};


export default observer(HistoryPanel);
