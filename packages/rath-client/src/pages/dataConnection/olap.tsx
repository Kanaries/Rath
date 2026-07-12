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

import React, { useCallback, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import ConnectionStatus from '../../components/connectionStatus';
import { IMuteFieldBase, IRow } from '../../interfaces';
import { useGlobalStore } from '../../store';
import { notify } from '../../components/error';
import { DataSourceTag } from '../../utils/storage';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Spinner } from '../../components/ui/spinner';
import { RathSelect, RathSelectOption } from '../../components/rath-ui/rath-select';

const PROTOCOL_LIST: RathSelectOption[] = [
    { text: 'https', key: 'https' },
    { text: 'http', key: 'http' },
];
interface OLAPDataProps {
    onClose: () => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name: undefined, tag: DataSourceTag) => void;
}

const OLAPData: React.FC<OLAPDataProps> = (props) => {
    const { onDataLoaded, onClose } = props;
    const { clickHouseStore } = useGlobalStore();

    const { databases, viewNames, currentDB, currentView, loadingDBs, loadingViews, connectStatus, config, proxyConfig } = clickHouseStore;
    const { protocol, user, password, host, port } = config;
    const { protocol: proxyProtocol, host: proxyHost, port: proxyPort } = proxyConfig;

    const dbOptions: RathSelectOption[] = databases.map((db) => ({
        key: db,
        text: db,
    }));

    const viewOptions: RathSelectOption[] = viewNames.map((v) => ({
        key: v,
        text: v,
    }));

    const linkInfoRef = useRef({ config, proxyConfig });
    linkInfoRef.current = { config, proxyConfig };

    const loadData = useCallback(() => {
        clickHouseStore
            .loadSampleData()
            .then(({ fieldMetas, data }) => {
                onDataLoaded(fieldMetas, data, undefined, DataSourceTag.OLAP);
                onClose();
            })
            .catch((err) => {
                notify({
                    title: 'Clickhouse Sample Data Load Error',
                    type: 'error',
                    content: `${err}\n Fail to load sample data from clickhouse.`,
                });
            });
    }, [clickHouseStore, onDataLoaded, onClose]);

    useEffect(() => {
        clickHouseStore
            .getDefaultConfig()
            .catch((err) => {
                notify({
                    title: 'Failed to load OLAP Config from server',
                    type: 'warning',
                    content: `${err}\n using default config instead.`,
                });
            })
            .finally(() => {
                clickHouseStore
                    .testConnection()
                    .then(() => {
                        return clickHouseStore.loadDBList();
                    })
                    .catch((err) => {
                        notify({
                            title: 'Clickhouse Connection Error',
                            type: 'error',
                            content: `Fail to Connect Clickhouse. \n ${err}`,
                        });
                    });
            });
    }, [clickHouseStore]);

    return (
        <div>
            <div className="flex flex-wrap items-end gap-2">
                <RathSelect
                    options={PROTOCOL_LIST}
                    label="Protocol"
                    selectedKey={proxyProtocol}
                    onChange={(key) => {
                        clickHouseStore.setProxyConfig('protocol', key as string);
                    }}
                />
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="connection-olap-proxy-host">Proxy Host</Label>
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">://</span>
                        <Input
                            id="connection-olap-proxy-host"
                            value={proxyHost}
                            onChange={(e) => {
                                clickHouseStore.setProxyConfig('host', e.target.value);
                            }}
                        />
                    </div>
                </div>
                <div className="flex w-20 flex-col gap-1.5">
                    <Label htmlFor="connection-olap-proxy-port">Port</Label>
                    <Input
                        id="connection-olap-proxy-port"
                        value={proxyPort}
                        onChange={(e) => {
                            clickHouseStore.setProxyConfig('port', e.target.value);
                        }}
                    />
                </div>
            </div>
            <div className="mt-2 flex flex-wrap items-end gap-2">
                <RathSelect
                    options={PROTOCOL_LIST}
                    label="Protocol"
                    selectedKey={protocol}
                    onChange={(key) => {
                        clickHouseStore.setConfig('protocol', key as string);
                    }}
                />
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="connection-olap-host">Host</Label>
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">://</span>
                        <Input
                            id="connection-olap-host"
                            value={host}
                            onChange={(e) => {
                                clickHouseStore.setConfig('host', e.target.value);
                            }}
                        />
                    </div>
                </div>
                <div className="flex w-20 flex-col gap-1.5">
                    <Label htmlFor="connection-olap-port">Port</Label>
                    <Input
                        id="connection-olap-port"
                        value={port}
                        onChange={(e) => {
                            clickHouseStore.setConfig('port', e.target.value);
                        }}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="connection-olap-user">User</Label>
                    <Input
                        id="connection-olap-user"
                        value={user}
                        onChange={(e) => {
                            clickHouseStore.setConfig('user', e.target.value);
                        }}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="connection-olap-password">Password</Label>
                    <Input
                        id="connection-olap-password"
                        type="password"
                        value={password}
                        placeholder="Empty(Default)"
                        onChange={(e) => {
                            clickHouseStore.setConfig('password', e.target.value);
                        }}
                    />
                </div>
            </div>
            <div style={{ marginTop: '1em' }}>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        clickHouseStore.testConnection();
                    }}
                >
                    Test Connection & update config
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className="ml-4"
                    onClick={() => {
                        clickHouseStore.loadDBList();
                    }}
                >
                    Fetch DB List
                </Button>
            </div>
            <ConnectionStatus status={connectStatus} />
            {loadingDBs && (
                <div className="my-2 flex items-center gap-2 text-sm">
                    <Spinner size="sm" />
                    loading database list from clickhouse
                </div>
            )}
            <RathSelect
                options={dbOptions}
                selectedKey={currentDB}
                label="Database"
                onChange={(key) => {
                    clickHouseStore.chooseDB(key as string);
                }}
            />
            {loadingViews && (
                <div className="my-2 flex items-center gap-2 text-sm">
                    <Spinner size="sm" />
                    loading table/view list from clickhouse
                </div>
            )}
            <RathSelect
                options={viewOptions}
                selectedKey={currentView}
                label="Table or View"
                onChange={(key) => {
                    clickHouseStore.chooseView(key as string);
                }}
            />
            <div style={{ marginTop: '1em' }}>
                <Button type="button" disabled={currentDB === null || currentView === null} onClick={loadData}>
                    Load
                </Button>
            </div>
        </div>
    );
};

export default observer(OLAPData);
