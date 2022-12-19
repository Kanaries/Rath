import intl from 'react-intl-universal';
import { Checkbox, Dropdown, Modal, PrimaryButton, Spinner, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, useEffect, useState } from 'react';
import { BlobWriter, ZipWriter, TextReader } from "@zip.js/zip.js";
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import { getKRFParseMap, IKRFComponents, KRF_VERSION } from '../../utils/download';
import { LoginPanel } from '../../pages/loginInfo/account';

const Cont = styled.div`
    padding: 1em;
    width: 400px;
    .modal-header{
        h3{
            font-size: 1.5em;
        }
        margin-bottom: 6px;
    }
    .modal-footer{
        margin-top: 1em;
    }
    .login {
        padding: 0.6em 1em 1em;
    }
`

const BackupModal: FC = (props) => {
    const { commonStore, dataSourceStore, collectionStore, causalStore, dashboardStore, userStore } = useGlobalStore();
    const { showBackupModal } = commonStore;
    const { info, loggedIn } = userStore;
    const rawDataLength = dataSourceStore.rawDataMetaInfo.length;
    const mutFieldsLength = dataSourceStore.mutFields.length;
    const collectionLength = collectionStore.collectionList.length;
    const [busy, setBusy] = useState(false);
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
    const organizations = info?.organizations;
    const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
    const workspaces = organizations?.find(org => org.id === selectedOrgId)?.workspaces;
    const [selectedWspId, setSelectedWspId] = useState<number | null>(null);
    const canBackup = selectedWspId !== null && Object.values(backupItemKeys).some(Boolean);
    useEffect(() => {
        setSelectedOrgId(null);
    }, [organizations]);
    useEffect(() => {
        setSelectedWspId(null);
        if (selectedOrgId !== null) {
            userStore.getWorkspaces(selectedOrgId).then(list => {
                if (list) {
                    setSelectedWspId(list[0]?.id ?? null);
                }
            });
        }
    }, [selectedOrgId, userStore]);
    // const storageItems =
    const backup = async () => {
        if (busy || !canBackup || selectedWspId === null) {
            return false;
        }
        setBusy(true);
        const parseMapItems = getKRFParseMap(backupItemKeys);
        const zipFileWriter = new BlobWriter();
        const zipWriter = new ZipWriter(zipFileWriter);
        const pm = new TextReader(JSON.stringify({
            items: parseMapItems,
            version: KRF_VERSION
        }));
        zipWriter.add("parse_map.json", pm);
        for await (const item of parseMapItems) {
            switch (item.key) {
                case IKRFComponents.data: {
                    const data = await dataSourceStore.backupDataStore()
                    const content = new TextReader(JSON.stringify(data));
                    await zipWriter.add(item.name, content);
                    break;
                }
                case IKRFComponents.meta: {
                    const data = await dataSourceStore.backupMetaStore()
                    const content = new TextReader(JSON.stringify(data));
                    await zipWriter.add(item.name, content);
                    break;
                }
                case IKRFComponents.mega: {
                    const data = await dataSourceStore.backupMetaStore()
                    const content = new TextReader(JSON.stringify(data));
                    await zipWriter.add(item.name, content);
                    break;
                }
                case IKRFComponents.collection: {
                    const data = await collectionStore.backupCollectionStore()
                    const content = new TextReader(JSON.stringify(data));
                    await zipWriter.add(item.name, content);
                    break;
                }
                case IKRFComponents.causal: {
                    const save = await causalStore.save();
                    if (save) {
                        const content = new TextReader(JSON.stringify(save));
                        await zipWriter.add(item.name, content);
                    }
                    break;
                }
                case IKRFComponents.dashboard: {
                    const save = dashboardStore.save();
                    const content = new TextReader(JSON.stringify(save));
                    await zipWriter.add(item.name, content);
                    break;
                }
                default: {
                    break;
                }
            }
        }
        const blob = await zipWriter.close();
        const file = new File([blob], 'rathds_backup.krf');
        await userStore.uploadWorkspace(selectedWspId ?? 0, file);
        // downloadFileFromBlob(blob, 'rathds_backup.krf');
        setBusy(false);
    };
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
        <Modal
            isOpen={showBackupModal}
            onDismiss={() => commonStore.setShowBackupModal(false)}
            isBlocking={false}
            containerClassName="modal-container"
        >
            <Cont>
                {loggedIn ? (
                    <>
                        <div className="modal-header">
                            <h3>{intl.get('storage.upload')}</h3>
                            <p className='state-description'>{intl.get('storage.upload_desc')}</p>
                        </div>
                        <Stack tokens={{ childrenGap: 10 }}>
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
                            <Dropdown
                                label={intl.get('user.organization')}
                                options={(organizations ?? []).map(org => ({
                                    key: `${org.id}`,
                                    text: org.name,
                                }))}
                                required
                                selectedKey={`${selectedOrgId}`}
                                onChange={(_, option) => option && setSelectedOrgId(Number(option.key))}
                            />
                            <Dropdown
                                label={intl.get('user.workspace')}
                                disabled={!Array.isArray(workspaces)}
                                options={(workspaces ?? []).map(wsp => ({
                                    key: `${wsp.id}`,
                                    text: wsp.name,
                                }))}
                                required
                                selectedKey={`${selectedWspId}`}
                                onChange={(_, option) => option && setSelectedWspId(Number(option.key))}
                            />
                        </Stack>
                        <div className="modal-footer">
                            <PrimaryButton disabled={!canBackup || busy} onClick={backup}>
                                {busy && <Spinner style={{ transform: 'scale(0.8)', transformOrigin: '0 50%' }} />}
                                {intl.get('storage.apply')}
                            </PrimaryButton>
                        </div>
                    </>
                ) : (
                    <div className="login">
                        <div className="modal-header">
                            <h3>{intl.get('login.login')}</h3>
                        </div>
                        <LoginPanel />
                    </div>
                )}
            </Cont>
        </Modal>
    );
};

export default observer(BackupModal);
