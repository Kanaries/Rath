import intl from 'react-intl-universal';
import { Stack, TextField, Toggle } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { useGlobalStore } from '../../../store';
import { downloadFileFromBlob } from '../../../utils/download';
import { CloudItemType } from '../../../pages/dataSource/selection/cloud/spaceList';
import { notify } from '../../error';
import useDefaultFilename from '../../../hooks/use-default-filename';
import { CloudAccessModifier } from '../../../interfaces';
import { writeDatasetFile } from '../utils';
import { IBackupFormHandler, IBackupFormProps, OrganizationDropdown, WorkspaceDropdown } from '.';


const DatasetBackupForm = forwardRef<IBackupFormHandler, IBackupFormProps>(function DatasetBackupForm (props, ref) {
    const { setBusy, setCanBackup, organizationName, workspaceName } = props;
    
    const { commonStore, dataSourceStore, userStore } = useGlobalStore();
    const { datasetId, sourceType } = dataSourceStore;
    const { cloudDataSourceMeta, cloudDatasetMeta } = userStore;
    const { id: dataSourceId } = cloudDataSourceMeta ?? {};
    const { id: cloudDatasetId, workspace } = cloudDatasetMeta ?? {};
    
    const [dataSourceName, setDataSourceName] = useState<string | null>(null);
    const [modifiableDataSourceName, setModifiableDataSourceName] = useState('');
    const defaultDataSourceName = `${datasetId || 'unnamed'}`;
    useEffect(() => {
        if (cloudDataSourceMeta === null) {
            setDataSourceName(null);
        } else {
            setDataSourceName(cloudDataSourceMeta.name);
        }
    }, [cloudDataSourceMeta, userStore]);
    const dsName = dataSourceName || modifiableDataSourceName || datasetId;

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
        if (canOverwrite && datasetOverwrite) {
            if (!cloudDataSourceMeta || !cloudDatasetMeta) {
                return false;
            }
        } else {
            if (workspaceName === null) {
                return false;
            }
        }
        return true;
    }, [cloudDataSourceMeta, cloudDatasetMeta, canOverwrite, datasetOverwrite, workspaceName]);

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
                        if (!organizationName) {
                            throw new Error('Organization is not chosen');
                        }
                        if (!workspaceName) {
                            throw new Error('Workspace is not chosen');
                        }
                        // TODO: allow user to select these two modes
                        const dataSourceSaveRes = await userStore.saveDataSourceOnCloudOfflineMode({
                            name: modifiableDataSourceName || defaultDataSourceName,
                            organizationName,
                            workspaceName,
                            datasourceType: sourceType,
                            fileInfo: {
                                fileName: file.name,
                                fileSize: file.size,
                            },
                        }, file);
                        if (!dataSourceSaveRes) {
                            throw new Error('Failed to upload data source');
                        }
                        const dataSource = await userStore.fetchDataSource(workspaceName, dataSourceSaveRes.id);
                        if (!dataSource) {
                            throw new Error('Failed to get data source');
                        }
                        userStore.setCloudDataSource(dataSource, organizationName, workspaceName);
                        dsId = userStore.cloudDataSourceMeta?.id;
                    }
                    if (dsId) {
                        const wspName = cloudDatasetId ? workspace!.name : workspaceName;
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
                            readOnly
                        />
                        <TextField
                            label={intl.get('storage.name', { mode: intl.get(`dataSource.importData.cloud.${CloudItemType.DATASET}`) })}
                            value={cloudDatasetMeta.name}
                            readOnly
                        />
                        <Toggle
                            label={intl.get('storage.public')}
                            checked={cloudDatasetMeta.type === CloudAccessModifier.PUBLIC}
                            onChange={() => void 0} // readOnly
                        />
                    </>
                )}
                {(!canOverwrite || !datasetOverwrite) && (
                    <>
                        <OrganizationDropdown {...props} />
                        <WorkspaceDropdown {...props} />
                        <TextField
                            label={intl.get('storage.data_source_name')}
                            value={dataSourceName ?? modifiableDataSourceName}
                            readOnly={dataSourceName !== null}
                            placeholder={defaultDataSourceName}
                            onChange={(_, val) => setModifiableDataSourceName(val ?? '')}
                            required
                        />
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
