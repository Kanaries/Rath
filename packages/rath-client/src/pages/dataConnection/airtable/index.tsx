import React, { useCallback, useState } from 'react';
import intl from 'react-intl-universal'
import { IMuteFieldBase, IRow } from '../../../interfaces';
import { rawData2DataWithBaseMetas } from '../../dataSource/utils';
import { DataSourceTag, IDBMeta } from '../../../utils/storage';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
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
                onClose();
            })
            .catch(onLoadingFailed);
    }, [onDataLoaded, onClose, onLoadingFailed, onStartLoading, endPoint, apiKey, tableID, tableName, viewName]);
    return (
        <div>
            <div className="flex max-w-[300px] flex-col gap-2">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="connection-airtable-endpoint">EndPoint</Label>
                    <Input id="connection-airtable-endpoint" required placeholder="https://api.airtable.com" onChange={(e) => { setEndPoint(e.target.value) }} value={endPoint} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="connection-airtable-token">Access token</Label>
                    <Input id="connection-airtable-token" required placeholder="pat*********" onChange={(e) => { setAPIKey(e.target.value) }} value={apiKey} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="connection-airtable-table-id">Table ID</Label>
                    <Input id="connection-airtable-table-id" required placeholder="app*******" onChange={(e) => { setTableID(e.target.value) }} value={tableID} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="connection-airtable-table-name">Table Name</Label>
                    <Input id="connection-airtable-table-name" required onChange={(e) => { setTableName(e.target.value) }} value={tableName} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="connection-airtable-view-name">View Name</Label>
                    <Input id="connection-airtable-view-name" required placeholder="Gird view" onChange={(e) => { setViewName(e.target.value) }} value={viewName} />
                </div>
                <div className="mt-4 flex gap-3">
                    <Button type="button" onClick={fetchData}>{ intl.get('dataSource.importData.load') }</Button>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                </div>
            </div>
        </div>
    );
};

export default AirTableSource;
