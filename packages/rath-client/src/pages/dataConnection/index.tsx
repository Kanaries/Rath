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

import React, { useCallback, useState } from 'react';
import { IBreadcrumbItem } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { Button } from '@fluentui/react-components';
import { Plus, Database } from 'lucide-react';
import { IDataSourceType } from '../../global';
import { IMuteFieldBase, IRow } from '../../interfaces';
import { DataSourceTag, IDBMeta, setDataStorage } from '../../utils/storage';
import { useGlobalStore } from '../../store';
import { PIVOT_KEYS } from '../../constants';
import { notify } from '../../components/error';
import HistoryPanel from './history';
import ConnectionCreation from './create';

interface DataConnectionProps {
    // show: boolean;
    // loading: boolean;
    // onClose: () => void;
    // onStartLoading: () => void;
    // onLoadingFailed: (err: any) => void;
    // onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name?: string, tag?: DataSourceTag | undefined, withHistory?: IDBMeta | undefined) => void;
    // onDataLoading: (p: number) => void;
    // toggleLoadingAnimation: (on: boolean) => void;
}
enum DS_PAGE_KEYS {
    display = 'display',
    create = 'create',
}

const DataConnection: React.FC<DataConnectionProps> = (props) => {
    const { dataSourceStore, commonStore, megaAutoStore, semiAutoStore } = useGlobalStore();
    // const { show, onClose, onDataLoaded, loading, onStartLoading, onLoadingFailed, onDataLoading, toggleLoadingAnimation } = props;
    const [dsPageKey, setDsPageKey] = useState<DS_PAGE_KEYS>(DS_PAGE_KEYS.display);
    const [dataSourceType, setDataSourceType] = useState<IDataSourceType | null>(null);

    const onSelectPannelClose = useCallback(() => {
        // dataSourceStore.setShowDataImportSelection(false);
        commonStore.setAppKey(PIVOT_KEYS.dataSource);
    }, [commonStore]);

    const onSelectDataLoaded = useCallback(
        (fields: IMuteFieldBase[], dataSource: IRow[], name?: string, tag?: DataSourceTag | undefined, withHistory?: IDBMeta | undefined) => {
            megaAutoStore.init();
            semiAutoStore.init();
            dataSourceStore.loadDataWithInferMetas(dataSource, fields);
            if (name && tag !== undefined) {
                dataSourceStore.setDatasetId(name);
                setDataStorage(name, fields, dataSource, tag, withHistory);
            }
        },
        [dataSourceStore, megaAutoStore, semiAutoStore]
    );

    const onLoadingFailed = useCallback(
        (err: any) => {
            dataSourceStore.setLoading(false);
            notify({
                type: 'error',
                title: '[Data Loading Error]',
                content: `${err}`,
            });
        },
        [dataSourceStore]
    );

    const _onBreadcrumbItemClicked = useCallback((ev?: React.MouseEvent<HTMLElement>, item?: IBreadcrumbItem) => {
        if (item && item.key === 'connection') {
            setDataSourceType(null);
        }
    }, []);

    const items: IBreadcrumbItem[] = [
        { text: intl.get('dataSource.dataSourceConnection.types'), key: 'connection', onClick: _onBreadcrumbItemClicked },
    ];

    if (dataSourceType !== null) {
        items.push({ text: intl.get(`dataSource.importData.type.${dataSourceType}`), key: dataSourceType, onClick: _onBreadcrumbItemClicked });
    }

    return (
        <div className="content-container">
            <div>
                {dsPageKey === DS_PAGE_KEYS.display && (
                    <Button
                        appearance="primary"
                        onClick={() => {
                            setDsPageKey(DS_PAGE_KEYS.create);
                        }}
                        icon={<Plus />}
                    >
                        Create DataSource
                    </Button>
                )}
                {dsPageKey === DS_PAGE_KEYS.create && (
                    <Button
                        appearance="primary"
                        onClick={() => {
                            setDsPageKey(DS_PAGE_KEYS.display);
                        }}
                        icon={<Database />}
                    >
                        My Data
                    </Button>
                )}
            </div>
            <div>
                {dsPageKey === DS_PAGE_KEYS.display && (
                    <HistoryPanel onClose={onSelectPannelClose} onDataLoaded={onSelectDataLoaded} onLoadingFailed={onLoadingFailed} />
                )}
                {dsPageKey === DS_PAGE_KEYS.create && <ConnectionCreation />}
            </div>
        </div>
    );
};

export default observer(DataConnection);
