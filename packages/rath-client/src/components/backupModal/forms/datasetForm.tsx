import intl from 'react-intl-universal';
import { PrimaryButton, Spinner, SpinnerSize, Stack, TextField, Toggle } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { useGlobalStore } from '../../../store';
import { downloadFileFromBlob } from '../../../utils/download';
import { CloudItemType } from '../../../pages/dataSource/selection/cloud/spaceList';
import { notify } from '../../error';
import useDefaultFilename from '../../../hooks/use-default-filename';
import WorkspaceRole from '../../../pages/loginInfo/workspaceRole';
import { CloudAccessModifier } from '../../../interfaces';
import { writeDatasetFile } from '../utils';
import type { IBackupFormHandler, IBackupFormProps } from '.';


const DatasetBackupForm = forwardRef<IBackupFormHandler, IBackupFormProps>(function DatasetBackupForm (props, ref) {
    const { setBusy, setCanBackup } = props;
    
    const { commonStore, dataSourceStore, userStore } = useGlobalStore();
    const { datasetId } = dataSourceStore;
    const { cloudDataSourceMeta, cloudDatasetMeta, currentOrgName, currentWspName, uploadDataSource, uploadingDataSource } = userStore;
    const { id: dataSourceId } = cloudDataSourceMeta ?? {};
    const { id: cloudDatasetId, workspace } = cloudDatasetMeta ?? {};
    
    const dsName = cloudDataSourceMeta?.name || datasetId;

    const [name, setName] = useState('');
    const emptyDefaultName = useDefaultFilename(intl.get(`dataSource.importData.cloud.${CloudItemType.DATASET}`));
    const defaultName = useMemo(() => {
        if (dsName) {
            return `${dsName} - ${dayjs().format('YYYY-MM-DD HHmm')}`;
        }
        return emptyDefaultName;
    }, [dsName, emptyDefaultName]);

    const canOverwrite = cloudDataSourceMeta && cloudDatasetMeta;

    const [datasetOverwrite, setDatasetOverwrite] = useState(true);

    const [accessMode, setAccessMode] = useState(CloudAccessModifier.PROTECTED);

    const canBackup = useMemo(() => {
        if (!cloudDataSourceMeta) {
            return false;
        }
        if (canOverwrite && datasetOverwrite) {
            if (!cloudDatasetMeta) {
                return false;
            }
        } else {
            if (currentWspName === null) {
                return false;
            }
        }
        return true;
    }, [cloudDataSourceMeta, cloudDatasetMeta, canOverwrite, datasetOverwrite, currentWspName]);

    const setCanBackupRef = useRef(setCanBackup);
    setCanBackupRef.current = setCanBackup;

    useEffect(() => {
        setCanBackupRef.current(canBackup);
    }, [canBackup]);

    useImperativeHandle(ref, () => ({
        async submit(download) {
            if (!canBackup) {
                return false;
            }
            setBusy(true);
            try {
                const [file, nRows, meta] = await writeDatasetFile(name || defaultName);
                if (download) {
                    downloadFileFromBlob(file, file.name);
                } else {
                    let dsId = dataSourceId;
                    if (dsId === undefined) {
                        if (!currentOrgName) {
                            throw new Error('Organization is not chosen');
                        }
                        if (!currentWspName) {
                            throw new Error('Workspace is not chosen');
                        }
                        if (!cloudDataSourceMeta) {
                            throw new Error('Data source is not successfully uploaded.')
                        }
                        const dataSource = await userStore.fetchDataSource(currentWspName, cloudDataSourceMeta.id);
                        if (!dataSource) {
                            throw new Error('Failed to get data source');
                        }
                        userStore.setCloudDataSource(dataSource, currentOrgName, currentWspName);
                        dsId = userStore.cloudDataSourceMeta?.id;
                    }
                    if (dsId) {
                        const wspName = cloudDatasetId ? workspace!.name : currentWspName;
                        if (!wspName) {
                            throw new Error('Workspace is not chosen');
                        }
                        await userStore.saveDatasetOnCloud({
                            id: (canOverwrite && datasetOverwrite) ? cloudDatasetId : undefined,
                            datasourceId: dsId,
                            name: name || defaultName,
                            workspaceName: wspName,
                            type: accessMode,
                            size: file.size,    
                            totalCount: nRows,
                            meta,
                        }, file);
                        commonStore.setShowBackupModal(false);
                    } else {
                        throw new Error('DatasourceID is empty');
                    }
                }
            } catch (error) {
                notify({
                    type: 'error',
                    title: 'Backup Dataset',
                    content: `${error}`,
                });
                return false;
            } finally {
                setBusy(false);
            }
            return true;
        },
    }));

    return (
        <>
            <p className='state-description'>{intl.get('storage.upload_desc', { mode: intl.get(`dataSource.importData.cloud.${CloudItemType.DATASET}`) })}</p>
            <Stack style={{ margin: '0.6em 0' }}>
                {canOverwrite && (
                    <Toggle
                        label={intl.get('storage.overwrite')}
                        checked={datasetOverwrite}
                        onChange={(_, checked) => setDatasetOverwrite(Boolean(checked))}
                    />
                )}
                {canOverwrite && datasetOverwrite && (
                    <>
                        <TextField
                            label={intl.get('storage.data_source_name')}
                            value={cloudDataSourceMeta.name}
                            disabled
                        />
                        <TextField
                            label={intl.get('storage.name', { mode: intl.get(`dataSource.importData.cloud.${CloudItemType.DATASET}`) })}
                            value={cloudDatasetMeta.name}
                            disabled
                        />
                        <Toggle
                            label={intl.get('storage.public')}
                            checked={cloudDatasetMeta.type === CloudAccessModifier.PUBLIC}
                            disabled
                        />
                    </>
                )}
                {(!canOverwrite || !datasetOverwrite) && (
                    <>
                        {!currentWspName && <WorkspaceRole />}
                        {cloudDataSourceMeta && (
                            <TextField
                                label={intl.get('storage.data_source_name')}
                                value={cloudDataSourceMeta.name}
                                disabled
                            />
                        )}
                        {!cloudDataSourceMeta && (
                            <div>
                                <PrimaryButton
                                    disabled={!uploadDataSource || !currentWspName || uploadingDataSource}
                                    onClick={() => uploadDataSource?.()}
                                    style={{ marginTop: '1em' }}
                                >
                                    {uploadingDataSource && <Spinner size={SpinnerSize.small} />}
                                    {uploadingDataSource || intl.get('storage.upload_data_source')}
                                </PrimaryButton>
                            </div>
                        )}
                        <TextField
                            label={intl.get('storage.name', { mode: intl.get(`dataSource.importData.cloud.${CloudItemType.DATASET}`) })}
                            value={name}
                            placeholder={defaultName}
                            onChange={(_, val) => setName(val ?? '')}
                            required
                        />
                        <Toggle
                            label={intl.get('storage.public')}
                            checked={accessMode === CloudAccessModifier.PUBLIC}
                            onChange={(_, checked) => setAccessMode(checked ? CloudAccessModifier.PUBLIC : CloudAccessModifier.PROTECTED)}
                        />
                    </>
                )}
            </Stack>
        </>
    );
});

export default observer(DatasetBackupForm);
