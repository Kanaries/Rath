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
import styled from 'styled-components';
import intl from 'react-intl-universal';
import MonacoEditor from 'react-monaco-editor';
import { DEMO_DATA_REQUEST_TIMEOUT } from '../../constants';
import { IDatasetBase, IMuteFieldBase, IRow } from '../../interfaces';
import { DataSourceTag } from '../../utils/storage';
import { RathIcon } from '../../components/icons';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

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

    const loadData = useCallback(() => {
        onStartLoading();
        requestAPIData(api)
            .then((data) => {
                const { dataSource, fields } = data;
                onDataLoaded(fields, dataSource, undefined, DataSourceTag.RESTFUL);
            })
            .catch((err) => {
                onLoadingFailed(err);
            });
        onClose();
    }, [api, onDataLoaded, onClose, onStartLoading, onLoadingFailed]);
    return (
        <Cont>
            <div className="inner-stack flex flex-col gap-1.5">
                <Label htmlFor="connection-restful-api">API</Label>
                <Input
                    id="connection-restful-api"
                    value={api}
                    onChange={(e) => {
                        setAPI(e.target.value);
                    }}
                />
            </div>
            <Button
                type="button"
                className="inner-button"
                onClick={loadData}
            >
                <RathIcon name="CloudDownload" />
                {intl.get('dataSource.importData.restful.requestData')}
            </Button>
            <h1>{intl.get('dataSource.importData.restful.exampleDataStruct')}</h1>
            <MonacoEditor width="600" height="300" language="json" theme="vs" value={JSON.stringify(EXAMPLE_DATA, null, 2)} />
        </Cont>
    );
};

export default RestFul;
