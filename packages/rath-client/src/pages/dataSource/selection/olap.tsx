import React, { useCallback, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import ConnectionStatus from '../../../components/connectionStatus';
import { IMuteFieldBase, IRow } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { notify } from '../../../components/error';
import { DataSourceTag } from '../../../utils/storage';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Spinner } from '../../../components/ui/spinner';
import { RathSelect, RathSelectOption } from '../../../components/rath-ui/rath-select';

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
                    <Label htmlFor="olap-proxy-host">Proxy Host</Label>
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">://</span>
                        <Input
                            id="olap-proxy-host"
                            value={proxyHost}
                            onChange={(e) => {
                                clickHouseStore.setProxyConfig('host', e.target.value);
                            }}
                        />
                    </div>
                </div>
                <div className="flex w-20 flex-col gap-1.5">
                    <Label htmlFor="olap-proxy-port">Port</Label>
                    <Input
                        id="olap-proxy-port"
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
                    <Label htmlFor="olap-host">Host</Label>
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">://</span>
                        <Input
                            id="olap-host"
                            value={host}
                            onChange={(e) => {
                                clickHouseStore.setConfig('host', e.target.value);
                            }}
                        />
                    </div>
                </div>
                <div className="flex w-20 flex-col gap-1.5">
                    <Label htmlFor="olap-port">Port</Label>
                    <Input
                        id="olap-port"
                        value={port}
                        onChange={(e) => {
                            clickHouseStore.setConfig('port', e.target.value);
                        }}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="olap-user">User</Label>
                    <Input
                        id="olap-user"
                        value={user}
                        onChange={(e) => {
                            clickHouseStore.setConfig('user', e.target.value);
                        }}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="olap-password">Password</Label>
                    <Input
                        id="olap-password"
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
