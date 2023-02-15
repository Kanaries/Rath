import intl from 'react-intl-universal';
import { Modal, Pivot, PivotItem, PrimaryButton, Spinner, SpinnerSize } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, useRef, useState } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../store';
import { LoginPanel } from '../../pages/loginInfo/account';
import { notify } from '../error';
import { CloudItemType } from '../../pages/dataSource/selection/cloud/spaceList';
import NotebookForm from './forms/notebookForm';
import type { IBackupFormHandler } from './forms';
import DatasetForm from './forms/datasetForm';

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
`;

const BackupModal: FC = (props) => {
    const { commonStore, userStore } = useGlobalStore();
    const { showBackupModal } = commonStore;
    const { loggedIn, uploadDataSource, cloudDataSourceMeta } = userStore;
    const [mode, setMode] = useState(CloudItemType.DATASET);
    
    const [busy, setBusy] = useState(false);

    const [canBackup, setCanBackup] = useState(false);

    const notebookFormRef = useRef<IBackupFormHandler>(null);
    const datasetFormRef = useRef<IBackupFormHandler>(null);

    const submit = async (download = false) => {
        if (!canBackup) {
            return false;
        }
        if (mode === CloudItemType.NOTEBOOK) {
            const ok = await notebookFormRef.current?.submit(download);
            if (ok) {
                notify({
                    type: 'success',
                    title: 'Saved Successfully',
                    content: '',
                });
            }
            return ok;
        }
        if (mode === CloudItemType.DATASET) {
            const ok = await datasetFormRef.current?.submit(download);
            if (ok) {
                notify({
                    type: 'success',
                    title: 'Saved Successfully',
                    content: '',
                });
            }
            return ok;
        }
    };

    if (!loggedIn) {
        return (
            <Modal
                isOpen={showBackupModal}
                onDismiss={() => commonStore.setShowBackupModal(false)}
                isBlocking={false}
                containerClassName="modal-container"
            >
                <Cont>
                    <div className="login">
                        <div className="modal-header">
                            <h3>{intl.get('login.login')}</h3>
                        </div>
                        <LoginPanel />
                    </div>
                </Cont>
            </Modal>
        );
    }

    const commonProps = {
        setBusy: setBusy,
        setCanBackup: setCanBackup,
    };

    const allowToUploadDataset = Boolean(uploadDataSource || cloudDataSourceMeta);

    return (
        <Modal
            isOpen={showBackupModal}
            onDismiss={() => commonStore.setShowBackupModal(false)}
            isBlocking={false}
            containerClassName="modal-container"
        >
            <Cont>
                <div className="modal-header">
                    <h3>{intl.get('storage.upload')}</h3>
                </div>
                <Pivot selectedKey={mode} onLinkClick={item => item?.props.itemKey && setMode(item.props.itemKey as CloudItemType)} styles={{ root: { marginBlock: '1em' } }}>
                    {allowToUploadDataset && (
                        <PivotItem itemKey={CloudItemType.DATASET} headerText={intl.get(`dataSource.importData.cloud.${CloudItemType.DATASET}`)}>
                            <DatasetForm ref={datasetFormRef} {...commonProps} />
                        </PivotItem>
                    )}
                    <PivotItem itemKey={CloudItemType.NOTEBOOK} headerText={intl.get(`dataSource.importData.cloud.${CloudItemType.NOTEBOOK}`)}>
                        <NotebookForm ref={notebookFormRef} {...commonProps} />
                    </PivotItem>
                </Pivot>
                <div className="modal-footer">
                    <PrimaryButton disabled={!canBackup || busy} onClick={() => submit()}>
                        {busy && <Spinner size={SpinnerSize.small} />}
                        {intl.get('storage.apply')}
                    </PrimaryButton>
                    {process.env.NODE_ENV === 'development' && (
                        <button onClick={() => submit(true)}>
                            Download File (dev)
                        </button>
                    )}
                </div>
            </Cont>
        </Modal>
    );
};

export default observer(BackupModal);
