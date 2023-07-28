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

import { PrimaryButton, Stack, TextField } from '@fluentui/react';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import MonacoEditor from 'react-monaco-editor';
import { DEMO_DATA_REQUEST_TIMEOUT } from '../../constants';
import { IDatasetBase, IMuteFieldBase, IRow } from '../../interfaces';
import { logDataImport } from '../../loggers/dataImport';
import { DataSourceTag } from '../../utils/storage';
import { useGlobalStore } from '../../store';

function requestAPIData(api: string): Promise<IDatasetBase> {
    return new Promise<IDatasetBase>((resolve, reject) => {
        let isTimeout = false;
        setTimeout(() => {
            isTimeout = true;
        }, DEMO_DATA_REQUEST_TIMEOUT);
        fetch(api)
            .then((res) => res.json())
            .then((res) => {
                if (!isTimeout) {
                    resolve(res);
                } else {
                    reject('API Data Request Timeout.');
                }
            })
            .catch((err) => reject(err));
    });
}

const EXAMPLE_DATA: IDatasetBase = {
    dataSource: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
    ],
    fields: [
        { fid: 'x', name: 'FieldX', analyticType: 'dimension', semanticType: 'ordinal', geoRole: 'none' },
        { fid: 'y', name: 'FieldY', analyticType: 'measure', semanticType: 'quantitative', geoRole: 'none' },
    ],
};
const Cont = styled.div`
    padding: 1em;
    .inner-button {
        margin-top: 1em;
        margin-bottom: 1em;
    }
`;
interface RestFulProps {
    onClose: () => void;
    onStartLoading: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name: undefined, tag: DataSourceTag) => void;
}
const RestFul: React.FC<RestFulProps> = (props) => {
    const { onClose, onStartLoading, onLoadingFailed, onDataLoaded } = props;
    const [api, setAPI] = useState<string>('');
    const { userStore } = useGlobalStore();

    const loadData = useCallback(() => {
        onStartLoading();
        requestAPIData(api)
            .then((data) => {
                const { dataSource, fields } = data;
                onDataLoaded(fields, dataSource, undefined, DataSourceTag.RESTFUL);
                logDataImport({
                    dataType: 'Restful API',
                    name: api,
                    fields,
                    dataSource: [],
                    size: dataSource.length,
                });
            })
            .catch((err) => {
                onLoadingFailed(err);
            });
        onClose();
    }, [api, onDataLoaded, onClose, onStartLoading, onLoadingFailed, userStore]);
    return (
        <Cont>
            <Stack className="inner-stack">
                <TextField
                    label="API"
                    value={api}
                    onChange={(e, val) => {
                        setAPI(`${val}`);
                    }}
                />
            </Stack>
            <PrimaryButton
                iconProps={{ iconName: 'CloudDownload' }}
                text={`${intl.get('dataSource.importData.restful.requestData')}`}
                className="inner-button"
                onClick={loadData}
            />
            <h1>{intl.get('dataSource.importData.restful.exampleDataStruct')}</h1>
            <MonacoEditor width="600" height="300" language="json" theme="vs" value={JSON.stringify(EXAMPLE_DATA, null, 2)} />
        </Cont>
    );
};

export default RestFul;
