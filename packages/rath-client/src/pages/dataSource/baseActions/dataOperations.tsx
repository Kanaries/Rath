import { observer } from 'mobx-react-lite';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import { Icon } from '@fluentui/react';
import { ArrowDownTrayIcon, CloudArrowUpIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useGlobalStore } from '../../../store';
import LaTiaoModal from '../../../components/latiaoConsole/modal';
import { useCleanMethodList } from '../../../hooks';
import { rows2csv } from '../../../utils/rows2csv';
import { downloadFileWithContent } from '../../../utils/download';
import Toolbar, { ToolbarItemProps } from '../../../components/toolbar';
import { IDataPreviewMode } from '../../../interfaces';

const Cont = styled.div`
    /* margin: 1em; */
    /* border: 1px solid red; */
    /* padding: 6px; */
    display: flex;
    align-items: center;
`;

const PlaceHolder = styled.svg`
    margin: 0 !important;
`;

const DataOperations: React.FC = () => {
    const { dataSourceStore, commonStore } = useGlobalStore();
    const { mutFields, cleanMethod, dataPreviewMode } = dataSourceStore;
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

    const [openLTDialog, setOpenLTDialog] = useState(false);
    
    const items = useMemo<ToolbarItemProps[]>(() => {
        return [
            {
                key: 'view:data',
                label: intl.get('dataSource.dataView'),
                icon: () => <Icon iconName="Table" />,
                checked: dataPreviewMode === IDataPreviewMode.data,
                onChange: checked => {
                    if (checked) {
                        dataSourceStore.setDataPreviewMode(IDataPreviewMode.data);
                    }
                },
            },
            {
                key: 'view:meta',
                label: intl.get('dataSource.metaView'),
                icon: () => <Icon iconName="ViewList" />,
                checked: dataPreviewMode === IDataPreviewMode.meta,
                onChange: checked => {
                    if (checked) {
                        dataSourceStore.setDataPreviewMode(IDataPreviewMode.meta);
                    }
                },
            },
            {
                key: 'view:stat',
                label: intl.get('dataSource.statView'),
                icon: () => <Icon iconName="BarChartVerticalFilter" />,
                checked: dataPreviewMode === IDataPreviewMode.stat,
                onChange: checked => {
                    if (checked) {
                        dataSourceStore.setDataPreviewMode(IDataPreviewMode.stat);
                    }
                },
            },
            '-',
            {
                key: 'latiao',
                label: intl.get('dataSource.extend.manual'),
                icon: () => <Icon iconName="AppIconDefaultAdd" />,
                onClick: () => setOpenLTDialog(true),
            },
            '-',
            {
                key: 'clean',
                label: intl.get('dataSource.cleanMethod'),
                options: cleanMethodListLang.map((m) => ({
                    key: m.key,
                    label: intl.get(`dataSource.methods.${m.key}`),
                    icon: () => <PlaceHolder />,
                })),
                icon: () => <Icon iconName="Broom" />,
                value: cleanMethod,
                onSelect: value => {
                    dataSourceStore.setCleanMethod(value as typeof cleanMethod);
                },
            },
            {
                key: 'export',
                icon: ArrowDownTrayIcon,
                label: intl.get('dataSource.downloadData.title'),
                options: [
                    {
                        key: 'downloadCSV',
                        label: intl.get('dataSource.downloadData.downloadCSV'),
                        icon: () => <PlaceHolder />,
                    },
                    {
                        key: 'downloadJSON',
                        label: intl.get('dataSource.downloadData.downloadJSON'),
                        icon: () => <PlaceHolder />,
                    },
                    {
                        key: 'downloadJSONMeta',
                        label: intl.get('dataSource.downloadData.downloadJSONMeta'),
                        icon: () => <PlaceHolder />,
                    },
                    {
                        key: 'downloadRATHDS',
                        label: intl.get('dataSource.downloadData.downloadRATHDS'),
                        icon: () => <PlaceHolder />,
                    },
                ],
                onSelect: key => {
                    switch (key) {
                        case 'downloadCSV': {
                            return exportDataAsCSV();
                        }
                        case 'downloadJSON': {
                            return exportDataAsJson();
                        }
                        case 'downloadJSONMeta': {
                            return exportDataset();
                        }
                        case 'downloadRATHDS': {
                            return exportDataAsRATHDS();
                        }
                        default: {
                            break;
                        }
                    }
                },
                disabled: mutFields.length === 0,
            },
            {
                key: 'fastSelection',
                label: intl.get('dataSource.fastSelection.title'),
                disabled: mutFields.length === 0,
                icon: FunnelIcon,
                onClick: () => {
                    dataSourceStore.setShowFastSelection(true);
                },
            },
            {
                key: 'enableAll',
                label: intl.get('dataSource.operations.selectAll'),
                icon: () => <Icon iconName="CheckList" />,
                onClick: () => {
                    dataSourceStore.setAllMutFieldsDisable(false);
                },
            },
            {
                key: 'disableAll',
                label: intl.get('dataSource.operations.disableAll'),
                icon: () => <Icon iconName="RemoveFilter" />,
                onClick: () => {
                    dataSourceStore.setAllMutFieldsDisable(true);
                },
            },
            '-',
            {
                key: 'backup',
                label: intl.get('dataSource.operations.backup'),
                icon: CloudArrowUpIcon,
                onClick: () => {
                    commonStore.setShowBackupModal(true);
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
        mutFields.length,
        exportDataAsRATHDS,
        commonStore,
        dataPreviewMode,
    ]);
    return (
        <Cont>
            <Toolbar items={items} />
            {openLTDialog && (
                <LaTiaoModal close={() => setOpenLTDialog(false)} />
            )}
        </Cont>
    );
};

export default observer(DataOperations);
