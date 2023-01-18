import intl from 'react-intl-universal';
import { Label, Modal, PrimaryButton, Spinner, Stack, TextField, Toggle } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import dayjs from 'dayjs';
import produce from 'immer';
import { useGlobalStore } from '../../store';
import { CloudItemType } from '../dataSource/selection/cloud/space';
import { CloudAccessModifier } from '../../interfaces';
import { notify } from '../../components/error';
import type { FlatDocumentInfo } from './dashboard-list';


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

const CoverUploader = styled.input``;

const BackupDialog: FC<{ open: boolean; onDismiss: () => void; value: FlatDocumentInfo }> = ({ open, onDismiss, value }) => {
    const { dataSourceStore, dashboardStore, userStore } = useGlobalStore();
    const { cloudDataSourceMeta, cloudDatasetMeta, currentOrg, currentWsp, fieldMetas } = dataSourceStore;
    const { loggedIn } = userStore;

    const [name, setName] = useState(value.name);
    const [templateName, setTemplateName] = useState('');

    const defaultName = useMemo(() => {
        return intl.get('storage.default_name', {
            date: dayjs().format('YYYY-MM-DD HHmm'),
            mode: intl.get('dataSource.importData.cloud.dashboard'),
        });
    }, []);

    const [desc, setDesc] = useState(value.description);
    const [templateDesc, setTemplateDesc] = useState('');

    const [templateCover, setTemplateCover] = useState<File | null>(null);

    const [showFieldDesc, setShowFieldDesc] = useState(false);
    const [fieldDesc, setFieldDesc] = useState<[fid: string, name: string, desc: string][]>([]);

    useEffect(() => {
        setFieldDesc(fieldMetas.map(f => [f.fid, f.name ?? '', '']));
    }, [cloudDataSourceMeta, fieldMetas]);
    
    const [busy, setBusy] = useState(false);

    const [accessMode, setAccessMode] = useState(CloudAccessModifier.PROTECTED);
    const canBackup = Boolean(cloudDataSourceMeta && currentOrg && currentWsp);

    const [doBindDataset, setDoBindDataset] = useState(Boolean(cloudDatasetMeta));
    useEffect(() => {
        setDoBindDataset(Boolean(cloudDatasetMeta));
    }, [cloudDatasetMeta]);
    
    const backup = async () => {
        if (!canBackup || !currentWsp) {
            return false;
        }
        setBusy(true);
        try {
            await dashboardStore.saveDashboardOnCloud(currentWsp, value.index, {
                dashboard: {
                    name: name || defaultName,
                    description: desc,
                    bindDataset: doBindDataset,
                },
                dashboardTemplate: {
                    name: templateName || defaultName,
                    description: templateDesc,
                    publish: accessMode === CloudAccessModifier.PUBLIC,
                    fieldDescription: Object.fromEntries(fieldDesc.map(([fid, , desc]) => [fid, desc])),
                    cover: templateCover === null ? undefined : templateCover,
                },
            });
            setBusy(false);
            return true;
        } catch (error) {
            notify({
                type: 'error',
                title: 'Failed to upload',
                content: `${error}`,
            });
            setBusy(false);
            return false;
        }
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
                {loggedIn && cloudDataSourceMeta && currentOrg && currentWsp && (
                    <>
                        <div className="scroll-container">
                            <Stack style={{ margin: '0.6em 0' }}>
                                <Label>
                                    {intl.get('storage.cover')}
                                </Label>
                                <CoverUploader
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    onChange={e => {
                                        setTemplateCover((e.target as HTMLInputElement).files?.item(0) ?? null);
                                    }}
                                />
                                <TextField
                                    label={intl.get('user.organization')}
                                    value={currentOrg}
                                    readOnly
                                />
                                <TextField
                                    label={intl.get('user.workspace')}
                                    value={currentWsp}
                                    readOnly
                                />
                                <TextField
                                    label={intl.get('storage.data_source_name')}
                                    value={cloudDataSourceMeta.name}
                                    readOnly
                                />
                                <Toggle
                                    label={intl.get('storage.bind_dataset')}
                                    checked={doBindDataset}
                                    disabled={!cloudDatasetMeta}
                                    onChange={(_, checked) => setDoBindDataset(Boolean(checked))}
                                />
                                <TextField
                                    label={intl.get('storage.name', { mode: intl.get('dataSource.importData.cloud.dashboard') })}
                                    value={name}
                                    placeholder={defaultName}
                                    onChange={(_, val) => setName(val ?? '')}
                                    required
                                />
                                <TextField
                                    label={intl.get('storage.desc', { mode: intl.get('dataSource.importData.cloud.dashboard') })}
                                    value={desc}
                                    onChange={(_, val) => setDesc(val ?? '')}
                                />
                                <Toggle
                                    label={intl.get('storage.publish_template')}
                                    checked={accessMode === CloudAccessModifier.PUBLIC}
                                    onChange={(_, checked) => setAccessMode(checked ? CloudAccessModifier.PUBLIC : CloudAccessModifier.PROTECTED)}
                                />
                                {accessMode === CloudAccessModifier.PUBLIC && (
                                    <>
                                        <TextField
                                            label={intl.get('storage.name', { mode: intl.get('dataSource.importData.cloud.dashboard_template') })}
                                            value={templateName}
                                            placeholder={defaultName}
                                            onChange={(_, val) => setTemplateName(val ?? '')}
                                            required
                                        />
                                        <TextField
                                            label={intl.get('storage.desc', { mode: intl.get('dataSource.importData.cloud.dashboard_template') })}
                                            value={templateDesc}
                                            onChange={(_, val) => setTemplateDesc(val ?? '')}
                                        />
                                    </>
                                )}
                                <Toggle
                                    label={intl.get('storage.field_desc')}
                                    checked={showFieldDesc}
                                    onChange={(_, checked) => setShowFieldDesc(Boolean(checked))}
                                />
                                {showFieldDesc && (
                                    <div style={{ border: '1px solid #8884', padding: '1em' }}>
                                        {fieldDesc.map(([fid, name, val], i) => (
                                            <TextField
                                                key={fid}
                                                label={fid}
                                                placeholder={name}
                                                value={val}
                                                onChange={(_, next) => setFieldDesc(all => produce(all, draft => {
                                                    draft[i][1] = next ?? '';
                                                }))}
                                            />
                                        ))}
                                    </div>
                                )}
                            </Stack>
                        </div>
                        <div className="modal-footer">
                            <PrimaryButton disabled={!canBackup || busy} onClick={() => backup()}>
                                {busy && <Spinner style={{ transform: 'scale(0.8)', transformOrigin: '0 50%' }} />}
                                {intl.get('storage.apply')}
                            </PrimaryButton>
                        </div>
                    </>
                )}
            </Cont>
        </Modal>
    );
};

export default observer(BackupDialog);
