import { PrimaryButton, Stack, TextField } from '@fluentui/react';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components'
import intl from 'react-intl-universal'
import MonacoEditor from 'react-monaco-editor';
import { DEMO_DATA_REQUEST_TIMEOUT } from '../../../constants';
import { DataSourceType, IDatasetBase, IMuteFieldBase, IRow } from '../../../interfaces';
import { DataSourceTag } from '../../../utils/storage';
import { useGlobalStore } from '../../../store';

function requestAPIData (api: string): Promise<IDatasetBase> {
    return new Promise<IDatasetBase>((resolve, reject) => {
        let isTimeout = false;
        setTimeout(() => {
            isTimeout = true;
        }, DEMO_DATA_REQUEST_TIMEOUT)
        fetch(api).then(res => res.json())
            .then(res => {
                if (!isTimeout) {
                    resolve(res)
                } else {
                    reject('API Data Request Timeout.')
                }
            })
            .catch(err => reject(err));
    })
} 

const EXAMPLE_DATA: IDatasetBase = {
    dataSource: [
        {x: 1, y: 10},
        {x: 2, y: 20}
    ],
    fields: [
        { fid: 'x', name: 'FieldX', analyticType: 'dimension', semanticType: 'ordinal', geoRole: 'none' },
        { fid: 'y', name: 'FieldY', analyticType: 'measure', semanticType: 'quantitative', geoRole: 'none' },
    ]
}
const Cont = styled.div`
    padding: 1em;
    .inner-button{
        margin-top: 1em;
        margin-bottom: 1em;
    }
`
interface RestFulProps {
    onClose: () => void;
    onStartLoading: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name: undefined, tag: DataSourceTag) => void;
}
const RestFul: React.FC<RestFulProps> = props => {
    const { onClose, onStartLoading, onLoadingFailed, onDataLoaded } = props;
    const [api, setAPI] = useState<string>('');
    const { userStore } = useGlobalStore();

    const loadData = useCallback(() => {
        onStartLoading();
        requestAPIData(api).then(data => {
            const { dataSource, fields } = data;
            onDataLoaded(fields, dataSource, undefined, DataSourceTag.RESTFUL);
            userStore.saveDataSourceOnCloudOnlineMode({
                name: api,
                datasourceType: DataSourceType.Restful,
                linkInfo: { api },
            });
        }).catch((err) => {
            onLoadingFailed(err);
        })
        onClose();
    }, [api, onDataLoaded, onClose, onStartLoading, onLoadingFailed, userStore])
    return <Cont>
        <Stack className="inner-stack">
            <TextField label="API" value={api} onChange={(e, val) => {
                setAPI(`${val}`);
            }} />
        </Stack>
        <PrimaryButton iconProps={{ iconName: 'CloudDownload' }} text={`${intl.get('dataSource.importData.restful.requestData')}`} className="inner-button" onClick={loadData} />
        <h1>{intl.get('dataSource.importData.restful.exampleDataStruct')}</h1>
        <MonacoEditor width="600" height="300" language="json" theme="vs" value={JSON.stringify(EXAMPLE_DATA, null, 2)} />
    </Cont>
}

export default RestFul;
