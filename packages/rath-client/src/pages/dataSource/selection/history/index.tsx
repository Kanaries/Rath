import { SearchBox } from "@fluentui/react";
import { observer } from "mobx-react-lite";
import { FC, useState } from "react";
import HistoryList, { IHistoryListProps } from "./history-list";


const HistoryPanel: FC<Pick<IHistoryListProps, 'onDataLoaded' | 'onClose' | 'onLoadingFailed'>> = (
    { onDataLoaded, onClose, onLoadingFailed }
) => {
    const [search, setSearch] = useState('');

    return (
        <>
            <SearchBox
                name="dataset_history_search"
                iconProps={{ iconName: "Search" }}
                styles={{ root: { margin: '1em 0 1.6em' } }}
                value={search}
                onChange={(_, value) => setSearch(value ?? '')}
                underlined
            />
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
