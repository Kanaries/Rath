import intl from 'react-intl-universal';
import { Modal } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, useMemo, useState } from 'react';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { useGlobalStore } from '../../store';
import { CloudItemType } from '../dataSource/selection/cloud/spaceList';
import type { ICreateDashboardConfig } from '../../interfaces';
import type { FlatDocumentInfo } from './dashboard-list';
import BackupForm from './backup-form';


const Cont = styled.div`
    padding: 1em;
    width: 400px;
    max-height: 60vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    > * {
        flex-grow: 0;
        flex-shrink: 0;
    }
    .modal-header{
        h3{
            font-size: 1.5em;
        }
        margin-bottom: 6px;
    }
    .modal-footer{
        margin-top: 1em;
    }
    .scroll-container {
        flex-grow: 1;
        flex-shrink: 1;
        overflow-y: auto;
    }
`;

const BackupDialog: FC<{ open: boolean; onDismiss: () => void; value: FlatDocumentInfo }> = ({ open, onDismiss, value }) => {
    const { dashboardStore, userStore } = useGlobalStore();
    const { cloudDatasetMeta, currentWspName: curWspName } = userStore;

    const defaultName = useMemo(() => {
        return intl.get('storage.default_name', {
            date: dayjs().format('YYYY-MM-DD HHmm'),
            mode: intl.get('dataSource.importData.cloud.dashboard'),
        });
    }, []);

    const [uploadConfig, setUploadConfig] = useState<ICreateDashboardConfig>({
        dashboard: {
            name: defaultName,
            description: value.description,
            bindDataset: Boolean(cloudDatasetMeta),
        },
        dashboardTemplate: {
            name: defaultName,
            description: '',
            publish: false,
            fieldDescription: {},
        },
    });

    const submit = async () => {
        if (!curWspName) {
            return;
        }
        await dashboardStore.saveDashboardOnCloud(curWspName, value.index, uploadConfig);
    };
    
    return (
        <Modal
            isOpen={open}
            onDismiss={onDismiss}
            isBlocking={false}
            containerClassName="modal-container"
        >
            <Cont>
                <div className="modal-header">
                    <h3>{intl.get('storage.upload')}</h3>
                    <p className='state-description'>{intl.get('storage.upload_desc', { mode: intl.get(`dataSource.importData.cloud.${CloudItemType.DATASET}`) })}</p>
                </div>
                <BackupForm
                    data={uploadConfig}
                    setData={next => setUploadConfig(next)}
                    submit={submit}
                />
            </Cont>
        </Modal>
    );
};

export default observer(BackupDialog);
