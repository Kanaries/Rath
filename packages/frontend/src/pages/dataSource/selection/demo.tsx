import { ChoiceGroup, DefaultButton, Label } from 'office-ui-fabric-react';
import React, { useCallback, useState } from 'react';
import { useId } from "@uifabric/react-hooks";
import intl from 'react-intl-universal';
import { BIField, Record } from '../../../global';
import { DemoDataAssets, IDemoDataKey, useDemoDataOptions } from '../config';
import { logDataImport } from '../../../loggers/dataImport';

interface DemoDataProps {
    onClose: () => void;
    onDataLoaded: (fields: BIField[], dataSource: Record[]) => void;
}

async function requestDemoData (dsKey: IDemoDataKey = 'CARS'): Promise<{dataSource: Record[], fields: BIField[]}> {
    const assetUrl = DemoDataAssets[dsKey];
    try {
        const res = await fetch(assetUrl);
        const { dataSource, fields } = await res.json();
        return { dataSource, fields };
    } catch (error) {
        console.error(error)
        return {
            dataSource: [],
            fields: []
        }
    }
} 

const DemoData: React.FC<DemoDataProps> = props => {
    const { onDataLoaded, onClose } = props;
    const options = useDemoDataOptions();
    const [dsKey, setDSKey] = useState<IDemoDataKey>('CARS');

    const loadData = useCallback(() => {
        requestDemoData(dsKey).then(data => {
            const { dataSource, fields } = data;
            onDataLoaded(fields, dataSource);
            logDataImport({
                dataType: "Demo",
                name: dsKey,
                fields,
                dataSource: [],
                size: dataSource.length,
            });
        })
        onClose();
    }, [dsKey, onDataLoaded, onClose])

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
                <DefaultButton text="load" onClick={loadData} />
            </div>
        </div>
    );
}

export default DemoData;
