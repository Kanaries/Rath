import React, { useCallback, useEffect } from  'react';
import { observer } from 'mobx-react-lite';
import ConnectionStatus from '../../../components/connectionStatus';
import { Dropdown, IDropdownOption, PrimaryButton, ProgressIndicator } from 'office-ui-fabric-react';
import { IRawField, IRow } from '../../../interfaces';
import { useGlobalStore } from '../../../store';

interface CHDataProps {
    onClose: () => void;
    onDataLoaded: (fields: IRawField[], dataSource: IRow[]) => void;
}

const ClickHouseData: React.FC<CHDataProps> = props => {
    const { onDataLoaded, onClose } = props;
    const { clickHouseStore, commonStore } = useGlobalStore();

    const { databases, viewNames, currentDB, currentView, loadingDBs, loadingViews, connectStatus } = clickHouseStore;

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
