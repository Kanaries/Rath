import { ChoiceGroup, DefaultButton, Label } from '@fluentui/react';
import React, { useCallback, useState } from 'react';
import { useId } from "@fluentui/react-hooks";
import intl from 'react-intl-universal';
import { DemoDataAssets, IDemoDataKey, useDemoDataOptions } from '../config';
import { logDataImport } from '../../../loggers/dataImport';
import { IDatasetBase, IMuteFieldBase, IRow } from '../../../interfaces';
import { DEMO_DATA_REQUEST_TIMEOUT } from '../../../constants';

interface DemoDataProps {
    onClose: () => void;
    onStartLoading: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[], name?: string) => void;
}

function valueFix (ds: IDatasetBase): IDatasetBase {
    for (let field of ds.fields) {
        if (typeof field.analyticType !== 'string') field.analyticType = 'dimension';
        if (typeof field.semanticType !== 'string') field.semanticType = 'nominal';
        if (typeof field.geoRole !== 'string') field.geoRole = 'none';
    }
    return ds;
}

function requestDemoData (dsKey: IDemoDataKey = 'CARS'): Promise<IDatasetBase> {
    return new Promise<IDatasetBase>((resolve, reject) => {
        const assetUrl = DemoDataAssets[dsKey];
        let isTimeout = false;
        setTimeout(() => {
            isTimeout = true;
        }, DEMO_DATA_REQUEST_TIMEOUT)
        fetch(assetUrl).then(res => res.json())
            .then(res => {
                if (!isTimeout) {
                    resolve(valueFix(res as IDatasetBase))
                } else {
                    reject('Demo Data Request Timeout.')
                }
            })
            .catch(err => reject(err));
    })
    // const assetUrl = DemoDataAssets[dsKey];
    // try {
    //     const res = await fetch(assetUrl);
    //     const { dataSource, fields } = await res.json();
    //     return { dataSource, fields };
    // } catch (error) {
    //     console.error(error)
    //     return {
    //         dataSource: [],
    //         fields: []
    //     }
    // }
} 

const DemoData: React.FC<DemoDataProps> = props => {
    const { onDataLoaded, onClose, onStartLoading, onLoadingFailed } = props;
    const options = useDemoDataOptions();
    const [dsKey, setDSKey] = useState<IDemoDataKey>('CARS');

    const loadData = useCallback(() => {
        onStartLoading();
        requestDemoData(dsKey).then(data => {
            const { dataSource, fields } = data;
            onDataLoaded(fields, dataSource, 'rdemo_' + dsKey);
            logDataImport({
                dataType: "Demo",
                name: dsKey,
                fields,
                dataSource: [],
                size: dataSource.length,
            });
        }).catch((err) => {
            onLoadingFailed(err);
        })
        onClose();
    }, [dsKey, onDataLoaded, onClose, onStartLoading, onLoadingFailed])

    const labelId = useId('demo-ds');
    return (
        <div>
            <Label id={labelId}>{intl.get("dataSource.importData.demo.available")}</Label>
            <ChoiceGroup
                options={options}
                selectedKey={dsKey}
                onChange={(ev, option) => {
                    if (option) {
                        setDSKey(option.key as IDemoDataKey);
                    }
                }}
            />
            <div className="vi-callout-actions">
                <DefaultButton text={intl.get('dataSource.importData.load')} onClick={loadData} />
            </div>
        </div>
    );
}

export default DemoData;
