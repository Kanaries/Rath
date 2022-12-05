import { Checkbox, Modal, PrimaryButton, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { BlobWriter, ZipWriter, TextReader } from "@zip.js/zip.js";
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import { downloadFileFromBlob, getKRFParseMap, IKRFComponents } from '../../utils/download';

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
    const { commonStore, dataSourceStore, collectionStore } = useGlobalStore();
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
        [IKRFComponents.mega]: false
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
    }, [rawDataLength, mutFieldsLength, collectionLength])
    // const storageItems =
    const backup = async () => {
        const parseMap = getKRFParseMap(backupItemKeys);
        const zipFileWriter = new BlobWriter();
        const zipWriter = new ZipWriter(zipFileWriter);
        const pm = new TextReader(JSON.stringify(parseMap));
        zipWriter.add("parse_map.json", pm);
        if (backupItemKeys.data && parseMap[IKRFComponents.data]) {
            const data = await dataSourceStore.backupDataStore()
            const content = new TextReader(JSON.stringify(data));
            await zipWriter.add(parseMap[IKRFComponents.data]!, content);
        }
        if (backupItemKeys.meta && parseMap[IKRFComponents.meta]) {
            const data = await dataSourceStore.backupMetaStore()
            const content = new TextReader(JSON.stringify(data));
            await zipWriter.add(parseMap[IKRFComponents.meta]!, content);
        }
        if (backupItemKeys.collection && parseMap[IKRFComponents.collection]) {
            const data = await collectionStore.backupCollectionStore()
            const content = new TextReader(JSON.stringify(data));
            await zipWriter.add(parseMap[IKRFComponents.collection]!, content);
        }
        const blob = await zipWriter.close();
        downloadFileFromBlob(blob, 'rathds_backup.krf');
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
                <div className="modal-footer">
                    <PrimaryButton text="backup" onClick={backup} />
                </div>
            </Cont>
        </Modal>
    );
};

export default observer(BackupModal);
