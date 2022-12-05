import { Checkbox, Modal, PrimaryButton, Stack } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import { downloadFileWithContent } from '../../utils/download';

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
        data: boolean;
        meta: boolean;
        collection: boolean;
    }>({
        data: rawDataLength > 0,
        meta: mutFieldsLength > 0,
        collection: collectionLength > 0,
    });
    useEffect(() => {
        setBackupItemKeys({
            data: rawDataLength > 0,
            meta: mutFieldsLength > 0,
            collection: collectionLength > 0,
        });
    }, [rawDataLength, mutFieldsLength, collectionLength])
    // const storageItems =
    const backup = () => {
        backupItemKeys.data && dataSourceStore.backupDataStore().then((data) => {
            const content = JSON.stringify(data);
            downloadFileWithContent(content, 'dataset_rathds.json');
        });
        backupItemKeys.meta && dataSourceStore.backupMetaStore().then((data) => {
            const content = JSON.stringify(data);
            downloadFileWithContent(content, 'dataset_rathds_meta.json');
        });
        backupItemKeys.collection && collectionStore.backupCollectionStore().then((data) => {
            const content = JSON.stringify(data);
            downloadFileWithContent(content, 'collection_rathds.json');
        });
    };
    const items = [
        {
            key: 'data',
            text: `Raw Data (${rawDataLength} rows)`,
        },
        {
            key: 'meta',
            text: `Meta Data (${mutFieldsLength} fields)`,
        },
        {
            key: 'collection',
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
