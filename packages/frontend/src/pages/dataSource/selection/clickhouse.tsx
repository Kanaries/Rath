import React, { useCallback, useEffect } from  'react';
import { observer } from 'mobx-react-lite';
import ConnectionStatus from '../../../components/connectionStatus';
import { DefaultButton, Dropdown, IDropdownOption, PrimaryButton, ProgressIndicator, Stack, TextField } from 'office-ui-fabric-react';
import { IRawField, IRow } from '../../../interfaces';
import { useGlobalStore } from '../../../store';

const StackTokens = {
    childrenGap: 20
}

// const TextFieldStyle = { width: '200px' }

const PROTOCOL_LIST: IDropdownOption[] = [
    { text: 'https', key: 'https' },
    { text: 'http', key: 'http' }
]
interface CHDataProps {
    onClose: () => void;
    onDataLoaded: (fields: IRawField[], dataSource: IRow[]) => void;
}

const ClickHouseData: React.FC<CHDataProps> = props => {
    const { onDataLoaded, onClose } = props;
    const { clickHouseStore, commonStore } = useGlobalStore();

    const { databases, viewNames, currentDB, currentView, loadingDBs, loadingViews, connectStatus, config } = clickHouseStore;
    const { protocol, user, password, host, port } = config;

    useEffect(() => {
        clickHouseStore.loadDBList()
            .catch((err) => {
                commonStore.showError('error', err.toString());
            })
    }, [clickHouseStore, commonStore])

    const dbOptions: IDropdownOption[] = databases.map(db => ({
        key: db,
        text: db
    }))

    const viewOptions: IDropdownOption[] = viewNames.map(v => ({
        key: v,
        text: v
    }))

    const loadData = useCallback(() => {
        clickHouseStore.loadSampleData()
            .then(({ fieldMetas, data}) => {
                onDataLoaded(fieldMetas, data);
                onClose();
            })
    }, [clickHouseStore, onDataLoaded, onClose])

    useEffect(() => {
        clickHouseStore.testConnection();
    }, [clickHouseStore])

    return <div>
        <Stack horizontal tokens={StackTokens}>
            {/* <Dropdown options={PROTOCOL_LIST}
                label="protocol"
                selectedKey={protocol}
                disabled
            /> */}
            <TextField prefix={`${protocol}://`} label="proxy host" value={host}
                onChange={(e, v) => { clickHouseStore.setConfig('host', v); }}
            />
            <TextField label="port" value={port}
                onChange={(e, v) => { clickHouseStore.setConfig('port', v); }}
            />
        </Stack>
        <Stack horizontal tokens={StackTokens}>
            <TextField label="user" value={user}
                onChange={(e, v) => { clickHouseStore.setConfig('user', v); }}
            />
            <TextField label="password" type="password" value={password} placeholder="Empty(Default)"
                onChange={(e, v) => { clickHouseStore.setConfig('password', v); }}
            />
        </Stack>
        <div style={{ marginTop: '1em'}}>
            <DefaultButton text="Connect"
                onClick={() => { clickHouseStore.testConnection(); }}
            />
            <PrimaryButton text="Update DB List" style={{ marginLeft: '1em' }}
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

export default observer(ClickHouseData);
