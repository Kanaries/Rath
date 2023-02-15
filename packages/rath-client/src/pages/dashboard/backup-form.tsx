import intl from 'react-intl-universal';
import { Label, PrimaryButton, Spinner, Stack, TextField, Toggle } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import produce from 'immer';
import { useGlobalStore } from '../../store';
import { ICreateDashboardConfig } from '../../interfaces';
import { notify } from '../../components/error';
import useDefaultFilename from '../../hooks/use-default-filename';

const CoverUploader = styled.input``;

export interface IBackupFormProps {
    data: ICreateDashboardConfig;
    setData: (next: ICreateDashboardConfig) => void;
    submit: () => Promise<void>;
}

const BackupForm: FC<IBackupFormProps> = ({ data, setData, submit }) => {
    const { dataSourceStore, userStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const { loggedIn, currentOrgName: curOrgName, currentWspName: curWspName, cloudDatasetMeta, cloudDataSourceMeta } = userStore;

    const defaultName = useDefaultFilename(intl.get('dataSource.importData.cloud.dashboard'));

    const setName = (name: string) => setData(produce(data, draft => {
        draft.dashboard.name = name;
    }));
    const setDescription = (desc: string) => setData(produce(data, draft => {
        draft.dashboard.description = desc;
    }));
    const setBindDataset = (bind: boolean) => setData(produce(data, draft => {
        draft.dashboard.bindDataset = bind;
    }));
    const setTemplateName = (name: string) => setData(produce(data, draft => {
        draft.dashboardTemplate.name = name;
    }));
    const setTemplateDescription = (desc: string) => setData(produce(data, draft => {
        draft.dashboardTemplate.description = desc;
    }));
    const setTemplatePublish = (publish: boolean) => setData(produce(data, draft => {
        draft.dashboardTemplate.publish = publish;
    }));
    const setTemplateCover = (cover: File | null | undefined) => setData(produce(data, draft => {
        draft.dashboardTemplate.cover = cover ?? undefined;
    }));
    const setFieldDesc = (fieldDesc: [fid: string, desc: string][]) => setData(produce(data, draft => {
        draft.dashboardTemplate.fieldDescription = Object.fromEntries(fieldDesc.map(([fid, desc]) => [fid, desc]));
    }));
    const descField = (fid: string, desc: string) => setData(produce(data, draft => {
        draft.dashboardTemplate.fieldDescription[fid] = desc;
    }));

    const [showFieldDesc, setShowFieldDesc] = useState(false);

    const setFieldDescRef = useRef(setFieldDesc);
    setFieldDescRef.current = setFieldDesc;

    useEffect(() => {
        setFieldDescRef.current(fieldMetas.map(f => [f.fid, f.name ?? '']));
    }, [cloudDataSourceMeta, fieldMetas]);
    
    const [busy, setBusy] = useState(false);

    const canBackup = Boolean(cloudDataSourceMeta && curOrgName && curWspName);

    const setBindDatasetRef = useRef(setBindDataset);
    setBindDatasetRef.current = setBindDataset;

    useEffect(() => {
        setBindDatasetRef.current(Boolean(cloudDatasetMeta));
    }, [cloudDatasetMeta]);
    
    const backup = async () => {
        if (!canBackup || !curWspName) {
            return false;
        }
        setBusy(true);
        try {
            await submit();
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

    if (!(loggedIn && cloudDataSourceMeta && curOrgName && curWspName)) {
        return null;
    }

    return (
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
                            setTemplateCover((e.target as HTMLInputElement).files?.item(0));
                        }}
                    />
                    <TextField
                        label={intl.get('storage.data_source_name')}
                        value={cloudDataSourceMeta.name}
                        disabled
                    />
                    <Toggle
                        label={intl.get('storage.bind_dataset')}
                        checked={data.dashboard.bindDataset}
                        disabled={!cloudDatasetMeta}
                        onChange={(_, checked) => setBindDataset(Boolean(checked))}
                    />
                    <TextField
                        label={intl.get('storage.name', { mode: intl.get('dataSource.importData.cloud.dashboard') })}
                        value={data.dashboard.name}
                        placeholder={defaultName}
                        onChange={(_, val) => setName(val ?? '')}
                        required
                    />
                    <TextField
                        label={intl.get('storage.desc', { mode: intl.get('dataSource.importData.cloud.dashboard') })}
                        value={data.dashboard.description}
                        onChange={(_, val) => setDescription(val ?? '')}
                    />
                    <Toggle
                        label={intl.get('storage.publish_template')}
                        checked={data.dashboardTemplate.publish}
                        onChange={(_, checked) => setTemplatePublish(Boolean(checked))}
                    />
                    {data.dashboardTemplate.publish && (
                        <>
                            <TextField
                                label={intl.get('storage.name', { mode: intl.get('dataSource.importData.cloud.dashboard_template') })}
                                value={data.dashboardTemplate.name}
                                placeholder={defaultName}
                                onChange={(_, val) => setTemplateName(val ?? '')}
                                required
                            />
                            <TextField
                                label={intl.get('storage.desc', { mode: intl.get('dataSource.importData.cloud.dashboard_template') })}
                                value={data.dashboardTemplate.description}
                                onChange={(_, val) => setTemplateDescription(val ?? '')}
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
                            {Object.entries(data.dashboardTemplate.fieldDescription).map(([fid, val]) => (
                                <TextField
                                    key={fid}
                                    label={fid}
                                    value={val}
                                    onChange={(_, next) => descField(fid, next ?? '')}
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
    );
};

export default observer(BackupForm);
