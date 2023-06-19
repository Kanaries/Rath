import React, { useCallback, useEffect, useRef } from  'react';
import { observer } from 'mobx-react-lite';
import { DefaultButton, Dropdown, IDropdownOption, PrimaryButton, ProgressIndicator, Stack, TextField } from '@fluentui/react';
import ConnectionStatus from '../../../components/connectionStatus';
import { DataSourceType, IMuteFieldBase, IRow } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { notify } from '../../../components/error';
import { DataSourceTag } from '../../../utils/storage';

const StackTokens = {
    childrenGap: 1
}

const PROTOCOL_LIST: IDropdownOption[] = [
    { text: 'https', key: 'https' },
    { text: 'http', key: 'http' }
]
interface OLAPDataProps {
    onClose: () => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name: undefined, tag: DataSourceTag) => void;
}

const OLAPData: React.FC<OLAPDataProps> = props => {
    const { onDataLoaded, onClose } = props;
    const { clickHouseStore, userStore } = useGlobalStore();

    const { databases, viewNames, currentDB, currentView, loadingDBs, loadingViews, connectStatus, config, proxyConfig } = clickHouseStore;
    const { protocol, user, password, host, port } = config;
    const { protocol: proxyProtocol, host: proxyHost, port: proxyPort } = proxyConfig

    const dbOptions: IDropdownOption[] = databases.map(db => ({
        key: db,
        text: db
    }))

    const viewOptions: IDropdownOption[] = viewNames.map(v => ({
        key: v,
        text: v
    }))

    const linkInfoRef = useRef({ config, proxyConfig });
    linkInfoRef.current = { config, proxyConfig };

    const loadData = useCallback(() => {
        clickHouseStore.loadSampleData()
            .then(({ fieldMetas, data}) => {
                userStore.saveDataSourceOnCloudOnlineMode({
                    name: '',
                    datasourceType: DataSourceType.Restful,
                    linkInfo: linkInfoRef.current,
                });
                onDataLoaded(fieldMetas, data, undefined, DataSourceTag.OLAP);
                onClose();
            })
            .catch((err) => {
                notify({
                    title: 'Clickhouse Sample Data Load Error',
                    type: 'error',
                    content: `${err}\n Fail to load sample data from clickhouse.`
                })
            })
    }, [clickHouseStore, onDataLoaded, onClose, userStore])

    useEffect(() => {
        clickHouseStore.getDefaultConfig()
        .catch((err) => {
            notify({
                title: 'Failed to load OLAP Config from server',
                type: 'warning',
                content: `${err}\n using default config instead.`
            })
        })
        .finally(() => {
            clickHouseStore.testConnection().then(() => {
                return clickHouseStore.loadDBList();
            }).catch((err) => {
                notify({
                    title: 'Clickhouse Connection Error',
                    type: 'error',
                    content: `Fail to Connect Clickhouse. \n ${err}`
                })
            })
        })
    }, [clickHouseStore])

    // useEffect(() => {
    //     fetch('https://localhost:2333/api/config/connection').then(res => res.json()).then(console.log)
    // }, [])

    return <div>
        <Stack horizontal tokens={StackTokens}>
            <Dropdown options={PROTOCOL_LIST}
                label="Protocol"
                selectedKey={proxyProtocol}
                onChange={(e, option) => {
                    clickHouseStore.setProxyConfig('protocol', option?.key as string)
                }}
            />
            <TextField prefix={`://`} label="Proxy Host" value={proxyHost}
                onChange={(e, v) => { clickHouseStore.setProxyConfig('host', v); }}
            />
            <TextField label="Port" style={{ width: '80px' }} value={proxyPort}
                onChange={(e, v) => { clickHouseStore.setProxyConfig('port', v); }}
            />
        </Stack>
        <Stack horizontal tokens={StackTokens}>
            <Dropdown options={PROTOCOL_LIST}
                label="Protocol"
                selectedKey={protocol}
                onChange={(e, option) => {
                    clickHouseStore.setConfig('protocol', option?.key as string)
                }}
            />
            <TextField prefix={`://`} label="Host" value={host}
                onChange={(e, v) => { clickHouseStore.setConfig('host', v); }}
            />
            <TextField style={{ width: '80px' }} label="Port" value={port}
                onChange={(e, v) => { clickHouseStore.setConfig('port', v); }}
            />
            <TextField label="User" value={user}
                onChange={(e, v) => { clickHouseStore.setConfig('user', v); }}
            />
            <TextField label="Password" type="password" value={password} placeholder="Empty(Default)"
                onChange={(e, v) => { clickHouseStore.setConfig('password', v); }}
            />
        </Stack>
        <div style={{ marginTop: '1em'}}>
            <DefaultButton text="Test Connection & update config"
                onClick={() => { clickHouseStore.testConnection(); }}
            />
            <DefaultButton text="Fetch DB List" style={{ marginLeft: '1em' }}
                onClick={() => {clickHouseStore.loadDBList(); }}
            />
        </div>
        <ConnectionStatus status={connectStatus} />
        { loadingDBs && <ProgressIndicator label="loading" description="loading database list from clickhouse" />}
        <Dropdown
            options={dbOptions}
            selectedKey={currentDB}
            label="Database"
            onChange={(e, item) => {
                item && clickHouseStore.chooseDB(item.key as string)
            }}
        />
        { loadingViews && <ProgressIndicator label="loading" description="loading table/view list from clickhouse" />}
        <Dropdown
            options={viewOptions}
            selectedKey={currentView}
            label="Table or View"
            onChange={(e, item) => {
                item && clickHouseStore.chooseView(item.key as string)
            }}
        />
        <div style={{ marginTop: '1em' }}>
            <PrimaryButton
                disabled={currentDB === null || currentView === null}
                text="Load"
                onClick={loadData}
            />
        </div>
    </div>
}

export default observer(OLAPData);
