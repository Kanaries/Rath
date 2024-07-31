import { DefaultButton, PrimaryButton, Stack, TextField } from '@fluentui/react';
import React, { useCallback, useState } from 'react';
import intl from 'react-intl-universal'
import { logDataImport } from '../../../loggers/dataImport';
import { IMuteFieldBase, IRow } from '../../../interfaces';
import { rawData2DataWithBaseMetas } from '../../dataSource/utils';
import { DataSourceTag, IDBMeta } from '../../../utils/storage';
import { fetchAllRecordsFromAirTable } from './utils';


interface AirTableSourceProps {
    onClose: () => void;
    onStartLoading: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name: string, tag: DataSourceTag, withHistory?: IDBMeta | undefined) => void;
}
const AirTableSource: React.FC<AirTableSourceProps> = (props) => {
    const { onClose, onDataLoaded, onLoadingFailed, onStartLoading } = props;
    const [endPoint, setEndPoint] = useState<string>('');
    const [apiKey, setAPIKey] = useState<string>('');
    const [tableID, setTableID] = useState<string>('');
    const [tableName, setTableName] = useState<string>('');
    const [viewName, setViewName] = useState<string>('');

    const fetchData = useCallback(() => {
        onStartLoading();
        const linkInfo = {
            endPoint,
            apiKey,
            tableID,
            tableName,
            viewName
        };
        fetchAllRecordsFromAirTable(linkInfo)
            .then((data) => rawData2DataWithBaseMetas(data))
            .then((ds) => {
                const name = `airtable-${tableName}-${viewName}`;
                onDataLoaded(ds.fields, ds.dataSource, name, DataSourceTag.AIR_TABLE);
                logDataImport({
                    dataType: 'AirTable',
                    fields: ds.fields,
                    dataSource: ds.dataSource.slice(0, 10),
                    size: ds.dataSource.length
                });
                onClose();
            })
            .catch(onLoadingFailed);
    }, [onDataLoaded, onClose, onLoadingFailed, onStartLoading, endPoint, apiKey, tableID, tableName, viewName]);
    return (
        <div>
            <Stack tokens={{ childrenGap: '4px' }} style={{ maxWidth: '300px' }}>
                <TextField required label="EndPoint" placeholder="https://api.airtable.com"
                    onChange={(e, value) => { setEndPoint(`${value}`) }}
                    value={endPoint}
                />
                <TextField required label="Access token" placeholder="pat*********"
                    onChange={(e, value) => { setAPIKey(`${value}`) }}
                    value={apiKey}
                />
                <TextField required label="Table ID" placeholder="app*******"
                    onChange={(e, value) => { setTableID(`${value}`) }}
                    value={tableID}
                />
                <TextField required label="Table Name"
                    onChange={(e, value) => { setTableName(`${value}`) }}
                    value={tableName}
                />
                <TextField required label="View Name" placeholder="Gird view"
                    onChange={(e, value) => { setViewName(`${value}`) }}
                    value={viewName}
                />
                <Stack.Item style={{ marginTop: '1em' }}>
                    <PrimaryButton onClick={fetchData}>{ intl.get('dataSource.importData.load') }</PrimaryButton>
                    <DefaultButton style={{ marginLeft: '1em' }} onClick={onClose}>Cancel</DefaultButton>
                </Stack.Item>
            </Stack>
        </div>
    );
};

export default AirTableSource;
