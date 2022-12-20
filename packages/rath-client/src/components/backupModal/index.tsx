import { Checkbox, Dropdown, Modal, PrimaryButton, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { BlobWriter, ZipWriter, TextReader } from "@zip.js/zip.js";
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import { getKRFParseMap, IKRFComponents, KRF_VERSION } from '../../utils/download';

const Cont = styled.div`
    padding: 1em;
    .modal-header{
        h3{
            font-size: 1.5em;
        }
        margin-bottom: 6px;
    }
    .modal-footer{
        margin-top: 1em;
    }
`

const BackupModal: React.FC = (props) => {
    const { commonStore, dataSourceStore, collectionStore, causalStore, dashboardStore, userStore } = useGlobalStore();
    const { showBackupModal } = commonStore;
    const rawDataLength = dataSourceStore.rawDataMetaInfo.length;
    const mutFieldsLength = dataSourceStore.mutFields.length;
    const collectionLength = collectionStore.collectionList.length;
    const [backupItemKeys, setBackupItemKeys] = React.useState<{
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
    const organizations = userStore.info?.organizations;
    const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
    const workspaces = organizations?.find(org => org.id === selectedOrgId)?.workspaces;
    const [selectedWspId, setSelectedWspId] = useState<number | null>(null);
    const canBackup = selectedWspId !== null;
    useEffect(() => {
        setSelectedOrgId(null);
    }, [organizations]);
    useEffect(() => {
        setSelectedWspId(null);
        if (selectedOrgId !== null) {
            userStore.getWorkspaces(selectedOrgId);
        }
    }, [selectedOrgId, userStore]);
    useEffect(() => {
        setSelectedWspId(null);
    }, [workspaces]);
    // const storageItems =
    const backup = async () => {
        if (!canBackup || selectedWspId === null) {
            return false;
        }
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
        userStore.uploadWorkspace(selectedWspId, file);
        // downloadFileFromBlob(blob, 'rathds_backup.krf');
    };
    const items = [
        {
            key: IKRFComponents.data,
            text: `Raw Data (${rawDataLength} rows)`,
        },
        {
            key: IKRFComponents.meta,
            text: `Meta Data (${mutFieldsLength} fields)`,
        },
        {
            key: IKRFComponents.collection,
            text: `Collection (${collectionLength} collections)`,
        },
        {
            key: 'causal',
            text: `Causal Model${causalStore.model.causality ? '' : ' (empty)'}`,
        },
        {
            key: 'dashboard',
            text: `Dashboard (${dashboardStore.pages.length} documents)`,
        },
    ]
    return (
        <Modal
            isOpen={showBackupModal}
            onDismiss={() => commonStore.setShowBackupModal(false)}
            isBlocking={false}
            containerClassName="modal-container"
        >
            <Cont>
                <div className="modal-header">
                    <h3>Backup</h3>
                    <p className='state-description'>backup your rath notebook</p>
                </div>
                <Stack tokens={{ childrenGap: 10 }}>
                    {items.map((item) => (
                        <Stack.Item key={item.key}>
                            <Checkbox
                                label={item.text}
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
                <Dropdown
                    options={(organizations ?? []).map(org => ({
                        key: `${org.id}`,
                        text: org.name,
                    }))}
                    selectedKey={`${selectedOrgId}`}
                    onChange={(_, option) => option && setSelectedOrgId(Number(option.key))}
                />
                {(workspaces ?? []).length > 0 && (
                    <Dropdown
                        options={workspaces!.map(wsp => ({
                            key: `${wsp.id}`,
                            text: wsp.name,
                        }))}
                        selectedKey={`${selectedWspId}`}
                        onChange={(_, option) => option && setSelectedWspId(Number(option.key))}
                    />
                )}
                <div className="modal-footer">
                    <PrimaryButton disabled={!canBackup} text="backup" onClick={backup} />
                </div>
            </Cont>
        </Modal>
    );
};

export default observer(BackupModal);
