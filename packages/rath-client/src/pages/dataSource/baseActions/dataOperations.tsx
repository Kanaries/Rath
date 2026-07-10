import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { RathIcon } from '../../../components/icons';
import { Button } from '../../../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { useGlobalStore } from '../../../store';
import { useCleanMethodList } from '../../../hooks';
import { rows2csv } from '../../../utils/rows2csv';
import { downloadFileWithContent } from '../../../utils/download';

const Cont = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0;
`;

const DataOperations: React.FC = () => {
    const { dataSourceStore/*, commonStore*/ } = useGlobalStore();
    const { mutFields, cleanMethod } = dataSourceStore;
    const exportDataset = useCallback(() => {
        const ds = dataSourceStore.exportDataAsDSService();
        const content = JSON.stringify(ds);
        downloadFileWithContent(content, 'dataset-with-metas.json');
    }, [dataSourceStore]);
    const exportDataAsJson = useCallback(() => {
        const content = JSON.stringify(dataSourceStore.exportCleanData());
        downloadFileWithContent(content, 'dataset.json');
    }, [dataSourceStore]);
    const exportDataAsCSV = useCallback(() => {
        const data = dataSourceStore.exportCleanData();
        const fields = dataSourceStore.fieldMetas;
        const content = rows2csv(data, fields);
        downloadFileWithContent(content, 'dataset.csv');
    }, [dataSourceStore]);
    const exportDataAsRATHDS = useCallback(() => {
        dataSourceStore.backupDataStore().then((data) => {
            const content = JSON.stringify(data);
            downloadFileWithContent(content, 'dataset_rathds.json');
        });
        dataSourceStore.backupMetaStore().then((data) => {
            const content = JSON.stringify(data);
            downloadFileWithContent(content, 'dataset_rathds_meta.json');
        });
    }, [dataSourceStore]);

    const cleanMethodListLang = useCleanMethodList();
    return (
        <Cont>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" className="gap-1.5">
                        <RathIcon name="Broom" />
                        <span>{intl.get('dataSource.cleanMethod')}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {cleanMethodListLang.map((method) => (
                        <DropdownMenuCheckboxItem
                            key={method.key}
                            checked={method.key === cleanMethod}
                            onCheckedChange={() => {
                                dataSourceStore.setCleanMethod(method.key);
                            }}
                        >
                            {method.text}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" disabled={mutFields.length === 0} className="gap-1.5">
                        <RathIcon name="download" />
                        <span>{intl.get('dataSource.downloadData.title')}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onSelect={exportDataAsCSV}>
                        {intl.get('dataSource.downloadData.downloadCSV')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={exportDataAsJson}>
                        {intl.get('dataSource.downloadData.downloadJSON')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={exportDataset}>
                        {intl.get('dataSource.downloadData.downloadJSONMeta')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={exportDataAsRATHDS}>
                        {intl.get('dataSource.downloadData.downloadRATHDS')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button
                type="button"
                variant="ghost"
                disabled={mutFields.length === 0}
                className="gap-1.5"
                onClick={() => {
                    dataSourceStore.setShowFastSelection(true);
                }}
            >
                <RathIcon name="filter" />
                <span>{intl.get('dataSource.fastSelection.title')}</span>
            </Button>
            <Button
                type="button"
                variant="ghost"
                className="gap-1.5"
                onClick={() => {
                    dataSourceStore.setAllMutFieldsDisable(false);
                }}
            >
                <RathIcon name="CheckboxComposite" />
                <span>{intl.get('dataSource.operations.selectAll')}</span>
            </Button>
            <Button
                type="button"
                variant="ghost"
                className="gap-1.5"
                onClick={() => {
                    dataSourceStore.setAllMutFieldsDisable(true);
                }}
            >
                <RathIcon name="Checkbox" />
                <span>{intl.get('dataSource.operations.disableAll')}</span>
            </Button>
        </Cont>
    );
};

export default observer(DataOperations);
