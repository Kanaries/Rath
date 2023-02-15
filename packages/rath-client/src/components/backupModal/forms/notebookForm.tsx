import intl from 'react-intl-universal';
import { Checkbox, Stack, TextField } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useGlobalStore } from '../../../store';
import { downloadFileFromBlob, getKRFParseMap, IKRFComponents } from '../../../utils/download';
import { CloudItemType } from '../../../pages/dataSource/selection/cloud/spaceList';
import { notify } from '../../error';
import useDefaultFilename from '../../../hooks/use-default-filename';
import WorkspaceRole from '../../../pages/loginInfo/workspaceRole';
import { writeNotebookFile } from '../utils';
import type { IBackupFormHandler, IBackupFormProps } from '.';


const NotebookBackupForm = forwardRef<IBackupFormHandler, IBackupFormProps>(function NotebookBackupForm (props, ref) {
    const { setBusy, setCanBackup } = props;
    const { commonStore, dataSourceStore, collectionStore, causalStore, dashboardStore, userStore } = useGlobalStore();
    const { currentWspName } = userStore;
    const rawDataLength = dataSourceStore.rawDataMetaInfo.length;
    const mutFieldsLength = dataSourceStore.mutFields.length;
    const collectionLength = collectionStore.collectionList.length;

    const [name, setName] = useState('');
    const defaultName = useDefaultFilename(intl.get(`dataSource.importData.cloud.${CloudItemType.NOTEBOOK}`));

    const [backupItemKeys, setBackupItemKeys] = useState<{
        [key in IKRFComponents]: boolean;
    }>({
        [IKRFComponents.data]: rawDataLength > 0,
        [IKRFComponents.meta]: mutFieldsLength > 0,
        [IKRFComponents.collection]: collectionLength > 0,
        [IKRFComponents.causal]: false,
        [IKRFComponents.dashboard]: false,
        [IKRFComponents.mega]: false,
    });

    useEffect(() => {
        setBackupItemKeys({
            data: rawDataLength > 0,
            meta: mutFieldsLength > 0,
            collection: collectionLength > 0,
            causal: false,
            dashboard: false,
            mega: false
        })
    }, [rawDataLength, mutFieldsLength, collectionLength]);
    
    const canBackup = currentWspName !== null && Object.values(backupItemKeys).some(Boolean);

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
                const parseMapItems = getKRFParseMap(backupItemKeys);
                const file = await writeNotebookFile(parseMapItems, name || defaultName);
                if (download) {
                    downloadFileFromBlob(file, file.name);
                } else {
                    const ok = await userStore.uploadNotebook(currentWspName, file);
                    if (ok) {
                        commonStore.setShowBackupModal(false);
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

    const items: {
        key: IKRFComponents;
        text: string;
        disabled?: boolean;
    }[] = [
        {
            key: IKRFComponents.data,
            text: intl.get('storage.components.data', { size: rawDataLength }),
        },
        {
            key: IKRFComponents.meta,
            text: intl.get('storage.components.meta', { size: mutFieldsLength }),
        },
        {
            key: IKRFComponents.collection,
            text: intl.get('storage.components.collection', { size: collectionLength }),
        },
        {
            key: IKRFComponents.causal,
            text: intl.get('storage.components.causal'),
            disabled: !causalStore.model.causality,
        },
        {
            key: IKRFComponents.dashboard,
            text: intl.get('storage.components.dashboard', { size: dashboardStore.pages.length }),
        },
    ];

    return (
        <>
            <p className='state-description'>{intl.get('storage.upload_desc', { mode: intl.get(`dataSource.importData.cloud.${CloudItemType.NOTEBOOK}`) })}</p>
            <WorkspaceRole />
            <Stack tokens={{ childrenGap: 10 }} style={{ marginTop: '1em' }}>
                {items.map((item) => (
                    <Stack.Item key={item.key}>
                        <Checkbox
                            label={item.text}
                            disabled={item.disabled}
                            checked={backupItemKeys[item.key as keyof typeof backupItemKeys]}
                            onChange={(e, checked) => {
                                setBackupItemKeys({
                                    ...backupItemKeys,
                                    [item.key]: checked,
                                });
                            }}
                        />
                    </Stack.Item>
                ))}
            </Stack>
            <Stack style={{ margin: '0.6em 0' }}>
                <TextField
                    label={intl.get('storage.name', { mode: intl.get(`dataSource.importData.cloud.${CloudItemType.NOTEBOOK}`) })}
                    value={name}
                    placeholder={defaultName}
                    onChange={(_, val) => setName(val ?? '')}
                    required
                />
            </Stack>
        </>
    );
});

export default observer(NotebookBackupForm);
