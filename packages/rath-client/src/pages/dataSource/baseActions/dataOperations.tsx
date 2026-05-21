import { CommandBar, IButtonProps, ICommandBarItemProps } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { useGlobalStore } from '../../../store';
import { useCleanMethodList } from '../../../hooks';
import { rows2csv } from '../../../utils/rows2csv';
import { downloadFileWithContent } from '../../../utils/download';
import { notify } from '../../../components/error';
import {
    createWorkflowSnapshot,
    exportWorkflowSession,
    importWorkflowSession,
} from '../../../utils/workflowSession';

const Cont = styled.div``;

const overflowProps: IButtonProps = {
    ariaLabel: 'More commands',
};

const overflowItems: ICommandBarItemProps[] = [];

const DataOperations: React.FC = () => {
    const { dataSourceStore, commonStore, workflowStore } = useGlobalStore();
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

    const exportWorkflow = useCallback(() => {
        const snapshot = createWorkflowSnapshot({
            appKey: commonStore.appKey,
            autopilotHandoff: workflowStore.autopilotHandoff,
            causalHandoff: workflowStore.causalHandoff,
            effectEstimate: workflowStore.effectEstimate,
        });
        downloadFileWithContent(exportWorkflowSession(snapshot), 'rath-workflow.json');
    }, [commonStore.appKey, workflowStore]);

    const importWorkflow = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const snapshot = importWorkflowSession(String(reader.result ?? ''));
                    workflowStore.setAutopilotHandoff(snapshot.autopilotHandoff ?? null);
                    workflowStore.setCausalHandoff(snapshot.causalHandoff ?? null);
                    workflowStore.setEffectEstimate(snapshot.effectEstimate ?? null);
                    if (snapshot.appKey) {
                        commonStore.setAppKey(snapshot.appKey);
                    }
                } catch (error) {
                    notify({
                        type: 'error',
                        title: intl.get('dataSource.workflow.importFailedTitle'),
                        content: error instanceof Error ? error.message : String(error),
                    });
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }, [commonStore, workflowStore]);

    const cleanMethodListLang = useCleanMethodList();
    const items = useMemo<ICommandBarItemProps[]>(() => {
        return [
            {
                key: 'clean',
                text: `${intl.get('dataSource.cleanMethod')}`,
                iconProps: { iconName: 'Broom' },
                subMenuProps: {
                    items: cleanMethodListLang.map((m) => ({
                        key: m.key + '',
                        text: m.text,
                        canCheck: true,
                        isChecked: m.key === cleanMethod,
                        onClick: () => {
                            dataSourceStore.setCleanMethod(m.key);
                        },
                    })),
                },
            },
            {
                key: 'export',
                text: intl.get('dataSource.downloadData.title'),
                iconProps: { iconName: 'download' },
                subMenuProps: {
                    items: [
                        {
                            key: 'downloadCSV',
                            text: intl.get('dataSource.downloadData.downloadCSV'),
                            onClick: exportDataAsCSV,
                        },
                        {
                            key: 'downloadJSON',
                            text: intl.get('dataSource.downloadData.downloadJSON'),
                            onClick: exportDataAsJson,
                        },
                        {
                            key: 'downloadJSONMeta',
                            text: intl.get('dataSource.downloadData.downloadJSONMeta'),
                            onClick: exportDataset,
                        },
                        {
                            key: 'downloadRATHDS',
                            text: intl.get('dataSource.downloadData.downloadRATHDS'),
                            onClick: exportDataAsRATHDS,
                        },
                        {
                            key: 'downloadWorkflow',
                            text: intl.get('dataSource.workflow.export'),
                            onClick: exportWorkflow,
                        },
                    ],
                },
                disabled: mutFields.length === 0,
            },
            {
                key: 'importWorkflow',
                text: intl.get('dataSource.workflow.import'),
                iconProps: { iconName: 'OpenFile' },
                onClick: importWorkflow,
            },
            {
                key: 'fastSelection',
                text: intl.get('dataSource.fastSelection.title'),
                disabled: mutFields.length === 0,
                iconProps: { iconName: 'filter' },
                onClick: () => {
                    dataSourceStore.setShowFastSelection(true);
                },
            },
            {
                key: 'enableAll',
                text: intl.get('dataSource.operations.selectAll'),
                iconProps: { iconName: 'CheckboxComposite' },
                onClick: () => {
                    dataSourceStore.setAllMutFieldsDisable(false);
                },
            },
            {
                key: 'disableAll',
                text: intl.get('dataSource.operations.disableAll'),
                iconProps: { iconName: 'Checkbox' },
                onClick: () => {
                    dataSourceStore.setAllMutFieldsDisable(true);
                },
            },
        ];
    }, [
        cleanMethod,
        cleanMethodListLang,
        dataSourceStore,
        exportDataset,
        exportDataAsCSV,
        exportDataAsJson,
        exportDataAsRATHDS,
        exportWorkflow,
        importWorkflow,
        mutFields.length,
    ]);

    return (
        <Cont>
            <CommandBar
                overflowButtonProps={overflowProps}
                styles={{
                    root: {
                        padding: 0,
                    },
                }}
                overflowItems={overflowItems}
                items={items}
            />
        </Cont>
    );
};

export default observer(DataOperations);
