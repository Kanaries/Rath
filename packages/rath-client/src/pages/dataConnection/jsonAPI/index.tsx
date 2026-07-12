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

import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import MonacoEditor from 'react-monaco-editor';
import { unstable_batchedUpdates } from 'react-dom';
import { IMuteFieldBase, IRow } from '../../../interfaces';
import { DataSourceTag } from '../../../utils/storage';
import { RathIcon } from '../../../components/icons';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { RathSelect } from '../../../components/rath-ui/rath-select';
import { IJSONAPIFormat, getFullData, getPreviewData, jsonDataFormatChecker, requestJSONAPIData } from './utils';

// const EXAMPLE_DATA: IDatasetBase = {
//     dataSource: [
//         { x: 1, y: 10 },
//         { x: 2, y: 20 },
//     ],
//     fields: [
//         { fid: 'x', name: 'FieldX', analyticType: 'dimension', semanticType: 'ordinal', geoRole: 'none' },
//         { fid: 'y', name: 'FieldY', analyticType: 'measure', semanticType: 'quantitative', geoRole: 'none' },
//     ],
// };
const API_STO_KEY = 'rath-client-json-api';
const Cont = styled.div`
    padding: 1em;
    .inner-button {
        margin-top: 1em;
        margin-bottom: 1em;
    }
`;
interface JSONAPIProps {
    onClose: () => void;
    onStartLoading: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name: undefined, tag: DataSourceTag) => void;
}
const JSONAPI: React.FC<JSONAPIProps> = (props) => {
    const { onClose, onLoadingFailed, onDataLoaded } = props;
    const [api, setAPI] = useState<string>('');
    const [detectedDataStruct, setDetectedDataStruct] = useState<IJSONAPIFormat | undefined>('others');
    const [rawData, setRawData] = useState<any>(undefined);
    const historyAPI = localStorage.getItem(API_STO_KEY);

    // http://localhost:3000/datasets/ds-cars-service.json
    const loadData = useCallback(async () => {
        try {
            const rawData = await requestJSONAPIData(api);
            const dataStructFormat = jsonDataFormatChecker(rawData);
            localStorage.setItem(API_STO_KEY, api);
            unstable_batchedUpdates(() => {
                setRawData(rawData);
                setDetectedDataStruct(dataStructFormat);
            });
        } catch (error) {
            onLoadingFailed(error);
        }
    }, [api, onLoadingFailed]);

    async function confirmData() {
        if (detectedDataStruct === undefined) return;
        const { dataSource, fields, error } = await getFullData(rawData, detectedDataStruct);
        if (typeof error === 'undefined') {
            onDataLoaded(fields, dataSource, undefined, DataSourceTag.RESTFUL);
        }
        onClose();
    }

    const previewData = useMemo(() => {
        if (detectedDataStruct === undefined) return rawData;
        return getPreviewData(rawData, detectedDataStruct);
    }, [rawData, detectedDataStruct]);

    return (
        <Cont>
            <div className="flex items-end gap-3">
                <div className="flex grow flex-col gap-1.5">
                    <Label htmlFor="connection-json-api-url">API</Label>
                    <Input
                        id="connection-json-api-url"
                        value={api}
                        onChange={(e) => {
                            setAPI(e.target.value);
                        }}
                    />
                </div>
                <Button type="button" onClick={loadData}>
                    <RathIcon name="CloudDownload" />
                    {intl.get('dataSource.importData.restful.requestData')}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        setAPI(historyAPI || '');
                    }}
                    disabled={!historyAPI}
                >
                    <RathIcon name="History" />
                    {intl.get('dataSource.importData.restful.loadHistoryAPI')}
                </Button>
            </div>
            {/* <h1>{intl.get('dataSource.importData.restful.exampleDataStruct')}</h1> */}
            <div className="mt-4 flex items-end gap-3">
                <RathSelect
                    label={intl.get('dataSource.importData.restful.detectedDataStruct')}
                    options={[
                        { key: 'array', text: intl.get('dataSource.importData.restful.format.array') },
                        { key: 'array_with_meta', text: intl.get('dataSource.importData.restful.format.array_with_meta') },
                        { key: 'others', text: intl.get('dataSource.importData.restful.format.others') },
                    ]}
                    selectedKey={detectedDataStruct}
                    onChange={(key) => {
                        setDetectedDataStruct(key as IJSONAPIFormat);
                    }}
                />
            </div>
            <hr style={{ margin: '1em 0em' }} />
            <MonacoEditor width="600" height="300" language="json" theme="vs" value={JSON.stringify(previewData, null, 2)} />
            <div className="mt-4 flex gap-3">
                <Button type="button" onClick={confirmData} disabled={detectedDataStruct === undefined || detectedDataStruct === 'others'}>
                    <RathIcon name="CheckMark" />
                    {intl.get('dataSource.importData.restful.confirm')}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        setDetectedDataStruct('others');
                        setRawData(undefined);
                    }}
                >
                    <RathIcon name="Delete" />
                    {intl.get('dataSource.importData.restful.clear')}
                </Button>
            </div>
        </Cont>
    );
};

export default JSONAPI;
