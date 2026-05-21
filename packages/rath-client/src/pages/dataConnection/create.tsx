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
import { Breadcrumb, IBreadcrumbItem, ProgressIndicator } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { Button, Card } from '@fluentui/react-components';
import { CornerUpLeft } from 'lucide-react';
import { IDataSourceType } from '../../global';
import DataLoadingStatus from '../dataSource/dataLoadingStatus';
import { useGlobalStore } from '../../store';
import { PIVOT_KEYS } from '../../constants';
import { useDataImportCallbacks } from '../../hooks/useDataImportCallbacks';
import DatabaseConnector from './database/main';
import FileData from './file';
import DemoData from './demo';
// import RestfulData from './restful';
import JSONAPI from './jsonAPI';
import OLAPData from './olap';
import HistoryPanel from './history';
import AirTableSource from './airtable';
import SupportedSources from './supportedSources';

interface ConnectionCreationProps {
    // show: boolean;
    // loading: boolean;
    // onClose: () => void;
    // onStartLoading: () => void;
    // onLoadingFailed: (err: any) => void;
    // onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name?: string, tag?: DataSourceTag | undefined, withHistory?: IDBMeta | undefined) => void;
    // onDataLoading: (p: number) => void;
    // toggleLoadingAnimation: (on: boolean) => void;
}

const Content = styled.div<{ open: boolean }>`
    min-height: ${({ open }) => (open ? '60vh' : 'unset')};
`;

const ConnectionCreation: React.FC<ConnectionCreationProps> = (props) => {
    const { commonStore } = useGlobalStore();

    const [dataSourceType, setDataSourceType] = useState<IDataSourceType | null>(null);

    const onSelectPannelClose = useCallback(() => {
        commonStore.setAppKey(PIVOT_KEYS.dataSource);
    }, [commonStore]);

    const {
        onSelectDataLoaded,
        onSelectStartLoading,
        onLoadingFailed,
        toggleLoadingAnimation,
        onDataLoading,
        loading,
    } = useDataImportCallbacks();

    const formMap: Record<IDataSourceType, JSX.Element> = {
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
        [IDataSourceType.DATABASE]: <DatabaseConnector onClose={onSelectPannelClose} onDataLoaded={onSelectDataLoaded} />,
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

    const items: IBreadcrumbItem[] = [
        { text: intl.get('dataSource.dataSourceConnection.types'), key: 'connection', onClick: _onBreadcrumbItemClicked, role: 'text' },
    ];

    if (dataSourceType !== null) {
        items.push({ text: intl.get(`dataSource.importData.type.${dataSourceType}`), key: dataSourceType, onClick: _onBreadcrumbItemClicked });
    }

    return (
        <div style={{ marginTop: '1em' }}>
            {dataSourceType !== null && (
                <Card>
                    <Breadcrumb
                        items={items}
                        maxDisplayedItems={10}
                        styles={{
                            itemLink: {
                                fontSize: '1em',
                            },
                        }}
                    />
                    <hr style={{ marginTop: '1em' }} />
                    <div style={{ margin: '2px 0em' }}>
                        <Button
                            icon={<CornerUpLeft />}
                            onClick={() => {
                                setDataSourceType(null);
                            }}
                        >
                            {intl.get('common.return')}
                        </Button>
                    </div>
                    <Content open={Boolean(dataSourceType)}>
                        {loading && dataSourceType !== IDataSourceType.FILE && <ProgressIndicator description="loading" />}
                        {loading && dataSourceType === IDataSourceType.FILE && <DataLoadingStatus />}
                        {dataSourceType && formMap[dataSourceType]}
                    </Content>
                </Card>
            )}

            <div>
                {dataSourceType === null && (
                    <SupportedSources
                        onSelected={(k) => {
                            setDataSourceType(k as IDataSourceType);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default observer(ConnectionCreation);
