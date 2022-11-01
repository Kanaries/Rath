import { ChoiceGroup, DefaultButton, Label } from '@fluentui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useId } from '@fluentui/react-hooks';
import intl from 'react-intl-universal';
import { DemoDataAssets, IDemoDataKey, useDemoDataOptions } from '../config';
import { logDataImport } from '../../../loggers/dataImport';
import { IDatasetBase, IMuteFieldBase, IRow } from '../../../interfaces';
import { DEMO_DATA_REQUEST_TIMEOUT } from '../../../constants';

interface DemoOption {
    key: string;
    text: string;
    url: string;
    isRelease: boolean;
}
interface DemoDataProps {
    onClose: () => void;
    onStartLoading: () => void;
    onLoadingFailed: (err: any) => void;
    onDataLoaded: (fields: IMuteFieldBase[], dataSource: IRow[]) => void;
}

function valueFix(ds: IDatasetBase): IDatasetBase {
    for (let field of ds.fields) {
        if (typeof field.analyticType !== 'string') field.analyticType = 'dimension';
        if (typeof field.semanticType !== 'string') field.semanticType = 'nominal';
        if (typeof field.geoRole !== 'string') field.geoRole = 'none';
    }
    return ds;
}

async function getOptionValue() {
    const res = await fetch('https://chspace.oss-cn-hongkong.aliyuncs.com/api/manifest.json');
    const result = (await res.json()) as DemoOption[];
    return result;
}

function requestDemoData(assetUrl: string): Promise<IDatasetBase> {
    return new Promise<IDatasetBase>((resolve, reject) => {
        let isTimeout = false;
        setTimeout(() => {
            isTimeout = true;
        }, DEMO_DATA_REQUEST_TIMEOUT);
        fetch(assetUrl)
            .then((res) => res.json())
            .then((res) => {
                if (!isTimeout) {
                    resolve(valueFix(res as IDatasetBase));
                } else {
                    reject('Demo Data Request Timeout.');
                }
            })
            .catch((err) => reject(err));
    });
}

const DemoData: React.FC<DemoDataProps> = (props) => {
    const { onDataLoaded, onClose, onStartLoading, onLoadingFailed } = props;
    const [options, setOptions] = useState<DemoOption[]>([]);
    const [dsKey, setDSKey] = useState<IDemoDataKey>('CARS');
    const [urlList, setUrlList] = useState<{ key: string; url: string }[]>([]);
    const loadData = useCallback(() => {
        onStartLoading();
        const url = urlList.filter((item) => item.key === dsKey)[0].url;
        requestDemoData(url)
            .then((data) => {
                const { dataSource, fields } = data;
                onDataLoaded(fields, dataSource);
                logDataImport({
                    dataType: 'Demo',
                    name: dsKey,
                    fields,
                    dataSource: [],
                    size: dataSource.length,
                });
            })
            .catch((err) => {
                onLoadingFailed(err);
            });
        onClose();
    }, [dsKey, onDataLoaded, onClose, onStartLoading, onLoadingFailed]);

    useEffect(() => {
        getOptionValue().then((res) => {
            const newUrl: { key: string; url: string }[] = res.map((item: { key: string; url: string }) => ({
                key: item.key,
                url: item.url,
            }));
            setUrlList(newUrl);
            const newOption = res.filter((item) => item.isRelease);
            setOptions(newOption);
        });
    }, []);

    const labelId = useId('demo-ds');
    return (
        <div>
            <Label id={labelId}>{intl.get('dataSource.importData.demo.available')}</Label>
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
};

export default DemoData;
