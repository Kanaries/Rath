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
import { Breadcrumb, DefaultButton, IBreadcrumbItem, ProgressIndicator } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import { IDataSourceType } from '../../global';
import { IMuteFieldBase, IRow } from '../../interfaces';
import { DataSourceTag, IDBMeta, setDataStorage } from '../../utils/storage';
import DataLoadingStatus from '../dataSource/dataLoadingStatus';
import { useGlobalStore } from '../../store';
import { Card } from '../../components/card';
import { PIVOT_KEYS } from '../../constants';
import FileData from './file';
import DemoData from './demo';
// import RestfulData from './restful';
import JSONAPI from './jsonAPI';
import OLAPData from './olap';
import HistoryPanel from './history';
import DatabaseConnector from './database-connector';
import AirTableSource from './airtable';
import Notebook from './notebook';
import SupportedSources from './supportedSources';

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

const DataConnection: React.FC<DataConnectionProps> = (props) => {
    const { dataSourceStore, commonStore } = useGlobalStore();
    const { loading } = dataSourceStore;
    // const { show, onClose, onDataLoaded, loading, onStartLoading, onLoadingFailed, onDataLoading, toggleLoadingAnimation } = props;

    const [dataSourceType, setDataSourceType] = useState<IDataSourceType | null>(null);

    const onSelectPannelClose = useCallback(() => {
        // dataSourceStore.setShowDataImportSelection(false);
        commonStore.setAppKey(PIVOT_KEYS.dataSource);
    }, [commonStore]);

    const onSelectDataLoaded = useCallback(
        (fields: IMuteFieldBase[], dataSource: IRow[], name?: string, tag?: DataSourceTag | undefined, withHistory?: IDBMeta | undefined) => {
            dataSourceStore.loadDataWithInferMetas(dataSource, fields);
            if (name && tag !== undefined) {
                dataSourceStore.setDatasetId(name);
                setDataStorage(name, fields, dataSource, tag, withHistory);
            }
        },
        [dataSourceStore]
    );

    const onSelectStartLoading = useCallback(() => {
        dataSourceStore.setLoading(true);
    }, [dataSourceStore]);

    const onLoadingFailed = useCallback(
        (err: any) => {
            dataSourceStore.setLoading(false);
            commonStore.showError('error', `[Data Loading Error]${err}`);
        },
        [dataSourceStore, commonStore]
    );

    const toggleLoadingAnimation = useCallback(
        (on: boolean) => {
            dataSourceStore.setLoading(on);
        },
        [dataSourceStore]
    );

    const onDataLoading = useCallback(
        (p: number) => {
            dataSourceStore.setLoadingDataProgress(Math.floor(p * 100) / 100);
        },
        [dataSourceStore]
    );

    const formMap: Record<IDataSourceType, JSX.Element> = {
        [IDataSourceType.NOTEBOOK]: <Notebook setLoadingAnimation={toggleLoadingAnimation} />,
        [IDataSourceType.FILE]: (
            <FileData
                onDataLoading={onDataLoading}
                onClose={onSelectPannelClose}
                onDataLoaded={onSelectDataLoaded}
                onLoadingFailed={onLoadingFailed}
                toggleLoadingAnimation={toggleLoadingAnimation}
            />
        ),
        [IDataSourceType.DEMO]: (
            <DemoData
                onClose={onSelectPannelClose}
                onDataLoaded={onSelectDataLoaded}
                onLoadingFailed={onLoadingFailed}
                onStartLoading={onSelectStartLoading}
            />
        ),
        [IDataSourceType.OLAP]: <OLAPData onClose={onSelectPannelClose} onDataLoaded={onSelectDataLoaded} />,
        [IDataSourceType.RESTFUL]: (
            <JSONAPI
                onClose={onSelectPannelClose}
                onDataLoaded={onSelectDataLoaded}
                onLoadingFailed={onLoadingFailed}
                onStartLoading={onSelectStartLoading}
            />
            // <RestfulData onClose={onSelectPannelClose} onDataLoaded={onSelectDataLoaded} onLoadingFailed={onLoadingFailed} onStartLoading={onSelectStartLoading} />
        ),
        [IDataSourceType.LOCAL]: <HistoryPanel onClose={onSelectPannelClose} onDataLoaded={onSelectDataLoaded} onLoadingFailed={onLoadingFailed} />,
        [IDataSourceType.DATABASE]: (
            <DatabaseConnector onClose={onSelectPannelClose} onDataLoaded={onSelectDataLoaded} />
        ),
        [IDataSourceType.AIRTABLE]: (
            <AirTableSource
                onClose={onSelectPannelClose}
                onDataLoaded={onSelectDataLoaded}
                onLoadingFailed={onLoadingFailed}
                onStartLoading={onSelectStartLoading}
            />
        ),
    };

    const _onBreadcrumbItemClicked = useCallback((ev?: React.MouseEvent<HTMLElement>, item?: IBreadcrumbItem) => {
        if (item && item.key === 'connection') {
            setDataSourceType(null);
        }
    }, []);

    const items: IBreadcrumbItem[] = [{ text: intl.get('dataSource.dataSourceConnection.types'), key: 'connection', onClick: _onBreadcrumbItemClicked }];

    if (dataSourceType !== null) {
        items.push({ text: intl.get(`dataSource.importData.type.${dataSourceType}`), key: dataSourceType, onClick: _onBreadcrumbItemClicked });
    }

    return (
        <div className="content-container">
            <Card style={{ flexGrow: 1, flexShrink: 0, flexBasis: 'max-content', display: 'flex', flexDirection: 'column' }}>
                <Breadcrumb
                    items={items}
                    maxDisplayedItems={10}
                    ariaLabel="Breadcrumb with items rendered as buttons"
                    overflowAriaLabel="More links"
                />
                { dataSourceType !== null && <hr style={{ marginTop: '1em' }} /> }
                {dataSourceType !== null && (
                    <div>
                        <DefaultButton
                            style={{ margin: '1em 0em' }}
                            text={intl.get('common.return')}
                            onClick={() => {
                                setDataSourceType(null);
                            }}
                        />
                    </div>
                )}
                <div style={{ flexGrow: 1, flexShrink: 0, flexBasis: 'max-content', flexDirection: 'column' }}>
                    {loading && dataSourceType !== IDataSourceType.FILE && <ProgressIndicator description="loading" />}
                    {loading && dataSourceType === IDataSourceType.FILE && <DataLoadingStatus />}
                    {dataSourceType && formMap[dataSourceType]}
                </div>
            </Card>
            {dataSourceType === null && (
                <div style={{ flexGrow: 9999, flexShrink: 0, flexBasis: 'max-content' }}>
                    <SupportedSources
                        onSelected={(k) => {
                            setDataSourceType(k as IDataSourceType);
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default observer(DataConnection);
