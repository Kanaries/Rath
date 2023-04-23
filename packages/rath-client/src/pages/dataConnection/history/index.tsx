// Copyright (C) 2023 observedobserver
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

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
                appearance="filled"
            />
        </>
    );
};


export default observer(HistoryPanel);
