import React, { useCallback, useEffect } from 'react';
import intl from 'react-intl-universal';
import { PrimaryButton, Stack, DefaultButton, Spinner } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../../store';
import { IDataPrepProgressTag, IDataPreviewMode, IMuteFieldBase, IRow } from '../../interfaces';
import { Card } from '../../components/card';
import { DataSourceTag, IDBMeta, setDataStorage } from '../../utils/storage';
import { BorderCard } from '../../components/borderCard';
import BackupModal from '../../components/backupModal';
import DataTable from './dataTable/index';
import MetaView from './metaView/index';
import Selection from './selection/index';
import ImportStorage from './importStorage';
import Advice from './advice';
import FastSelection from './fastSelection';
import ProfilingView from './profilingView';
import MainActionButton from './baseActions/mainActionButton';
import DataOperations from './baseActions/dataOperations';
import DataInfo from './dataInfo';

const MARGIN_LEFT = { marginLeft: '1em' };

interface DataSourceBoardProps {}

const DataSourceBoard: React.FC<DataSourceBoardProps> = (props) => {
    const { dataSourceStore, commonStore } = useGlobalStore();

    const { rawDataMetaInfo, loading, showDataImportSelection, dataPreviewMode, dataPrepProgressTag } =
        dataSourceStore;
    useEffect(() => {
        // 注意！不要对useEffect加依赖rawData，因为这里是初始加载的判断。
        if (rawDataMetaInfo.length === 0) {
            dataSourceStore.setShowDataImportSelection(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataSourceStore]);

    const dataImportButton = useCallback(
        (text: string, dataSourceIsEmpty: boolean) => {
            let UsedButton = dataSourceIsEmpty ? PrimaryButton : DefaultButton;
            return (
                <UsedButton
                    style={MARGIN_LEFT}
                    iconProps={{ iconName: 'SearchData' }}
                    text={text}
                    onClick={() => {
                        dataSourceStore.setShowDataImportSelection(true);
                    }}
                />
            );
        },
        [dataSourceStore]
    );

    const onSelectPannelClose = useCallback(() => {
        dataSourceStore.setShowDataImportSelection(false);
    }, [dataSourceStore]);

    const onSelectDataLoaded = useCallback(
        (fields: IMuteFieldBase[], dataSource: IRow[], name?: string, tag?: DataSourceTag | undefined, withHistory?: IDBMeta | undefined) => {
            dataSourceStore.loadDataWithInferMetas(dataSource, fields);
            if (name && tag !== undefined) {
                dataSourceStore.setDatasetId(name);
                setDataStorage(name, fields, dataSource, tag, withHistory);
            }
        },
        [dataSourceStore]
    );

    const onSelectStartLoading = useCallback(() => {
        dataSourceStore.setLoading(true);
    }, [dataSourceStore]);

    const onSelectLoadingFailed = useCallback(
        (err: any) => {
            dataSourceStore.setLoading(false);
            commonStore.showError('error', `[Data Loading Error]${err}`);
        },
        [dataSourceStore, commonStore]
    );

    const toggleLoadingAnimation = useCallback(
        (on: boolean) => {
            dataSourceStore.setLoading(on);
        },
        [dataSourceStore]
    );

    const onDataLoading = useCallback(
        (p: number) => {
            dataSourceStore.setLoadingDataProgress(Math.floor(p * 100) / 100);
        },
        [dataSourceStore]
    );
    return (
        <div className="content-container" style={{ position: 'relative' }}>
            <Card backgroundColor="unset">
                <ImportStorage />
                <FastSelection />
                <BackupModal />
                <Stack horizontal>
                    <MainActionButton />
                    {dataImportButton(intl.get('dataSource.importData.buttonName'), rawDataMetaInfo.length === 0)}
                    {/* <IconButton
                        style={MARGIN_LEFT}
                        title={intl.get('function.importStorage.title')}
                        ariaLabel={intl.get('function.importStorage.title')}
                        iconProps={{ iconName: 'CloudUpload' }}
                        onClick={() => {
                            commonStore.setShowStorageModal(true);
                        }}
                    /> */}

                    {dataPrepProgressTag !== IDataPrepProgressTag.none && (
                        <Spinner style={MARGIN_LEFT} label={dataPrepProgressTag} ariaLive="assertive" labelPosition="right" />
                    )}

                    <Selection
                        show={showDataImportSelection}
                        onDataLoading={onDataLoading}
                        loading={loading}
                        onClose={onSelectPannelClose}
                        onDataLoaded={onSelectDataLoaded}
                        onStartLoading={onSelectStartLoading}
                        onLoadingFailed={onSelectLoadingFailed}
                        setLoadingAnimation={toggleLoadingAnimation}
                    />
                </Stack>
                {/* <hr style={{ margin: '0.6em 0em', border: 'none' }} /> */}
                <BorderCard>
                    {rawDataMetaInfo.length > 0 && <DataOperations />}
                    <DataInfo />
                    {rawDataMetaInfo.length > 0 && <Advice />}
                    {dataPreviewMode === IDataPreviewMode.data && <DataTable />}
                    {dataPreviewMode === IDataPreviewMode.meta && <MetaView />}
                    {dataPreviewMode === IDataPreviewMode.stat && <ProfilingView />}
                </BorderCard>
            </Card>
        </div>
    );
};

export default observer(DataSourceBoard);
