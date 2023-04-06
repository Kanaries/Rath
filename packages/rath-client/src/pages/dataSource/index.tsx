import React, { useCallback } from 'react';
import intl from 'react-intl-universal';
import { PrimaryButton, Stack, DefaultButton, Pivot, PivotItem, Spinner } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../../store';
import { IDataPrepProgressTag, IDataPreviewMode, IMuteFieldBase, IRow } from '../../interfaces';
import { Card } from '../../components/card';
import { DataSourceTag, IDBMeta, setDataStorage } from '../../utils/storage';
import BackupModal from '../../components/backupModal';
import { notify } from '../../components/error';
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
    const { dataSourceStore, megaAutoStore, semiAutoStore } = useGlobalStore();

    const { rawDataMetaInfo, loading, showDataImportSelection, dataPreviewMode, dataPrepProgressTag } =
        dataSourceStore;

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
            megaAutoStore.init();
            semiAutoStore.init();
            dataSourceStore.loadDataWithInferMetas(dataSource, fields, tag);
            if (name && tag !== undefined) {
                dataSourceStore.setDatasetId(name);
                setDataStorage(name, fields, dataSource, tag, withHistory);
            }
        },
        [dataSourceStore, megaAutoStore, semiAutoStore]
    );

    const onSelectStartLoading = useCallback(() => {
        dataSourceStore.setLoading(true);
    }, [dataSourceStore]);

    const onSelectLoadingFailed = useCallback(
        (err: any) => {
            dataSourceStore.setLoading(false);
            notify({
                type: 'error',
                title: '[Data Loading Error]',
                content: `${err}`,
            });
        },
        [dataSourceStore]
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
            <Card fitContainer>
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
                <hr style={{ margin: '1em 0em 0em 0em' }} />
                <Pivot
                    style={{ marginBottom: '6px' }}
                    selectedKey={dataPreviewMode}
                    onLinkClick={(item) => {
                        item && dataSourceStore.setDataPreviewMode(item.props.itemKey as IDataPreviewMode);
                    }}
                >
                    <PivotItem itemKey={IDataPreviewMode.data} headerText={intl.get('dataSource.dataView')} itemIcon="Table" />
                    <PivotItem itemKey={IDataPreviewMode.meta} headerText={intl.get('dataSource.metaView')} itemIcon="ViewList" />
                    <PivotItem itemKey={IDataPreviewMode.stat} headerText={intl.get('dataSource.statView')} itemIcon="BarChartVerticalFilter" />
                </Pivot>
                {rawDataMetaInfo.length > 0 && <DataOperations />}
                <DataInfo />
                {rawDataMetaInfo.length > 0 && <Advice />}
                {dataPreviewMode === IDataPreviewMode.data && <DataTable />}
                {dataPreviewMode === IDataPreviewMode.meta && <MetaView />}
                {dataPreviewMode === IDataPreviewMode.stat && <ProfilingView />}

            </Card>
        </div>
    );
};

export default observer(DataSourceBoard);
