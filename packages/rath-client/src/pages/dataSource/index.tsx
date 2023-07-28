import React, { useCallback } from 'react';
import intl from 'react-intl-universal';
import { Stack, Spinner } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { Button, Tab, TabList } from '@fluentui/react-components';
import { AppsListDetail24Regular, DataBarVertical24Regular, Database24Regular, TableFreezeRow24Regular } from '@fluentui/react-icons';
import { useGlobalStore } from '../../store';
import { IDataPrepProgressTag, IDataPreviewMode, IMuteFieldBase, IRow } from '../../interfaces';
import { DataSourceTag, IDBMeta, setDataStorage } from '../../utils/storage';
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

    const { rawDataMetaInfo, loading, showDataImportSelection, dataPreviewMode, dataPrepProgressTag } = dataSourceStore;

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
            <div>
                <ImportStorage />
                <FastSelection />
                <Stack horizontal>
                    <MainActionButton />
                    <Button
                        appearance={rawDataMetaInfo.length === 0 ? 'primary' : 'secondary'}
                        onClick={() => {
                            dataSourceStore.setShowDataImportSelection(true);
                        }}
                        style={MARGIN_LEFT}
                        icon={<Database24Regular />}
                    >
                        {intl.get('dataSource.importData.buttonName')}
                    </Button>

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
                <TabList selectedValue={dataPreviewMode} onTabSelect={(e, item) => {
                    item.value && dataSourceStore.setDataPreviewMode(item.value as IDataPreviewMode);
                }}>
                    <Tab value={IDataPreviewMode.data} icon={<TableFreezeRow24Regular />}>{intl.get('dataSource.dataView')}</Tab>
                    <Tab value={IDataPreviewMode.meta} icon={<AppsListDetail24Regular />}>{intl.get('dataSource.metaView')}</Tab>
                    <Tab value={IDataPreviewMode.stat} icon={<DataBarVertical24Regular />}>{intl.get('dataSource.statView')}</Tab>
                </TabList>
                {rawDataMetaInfo.length > 0 && <DataOperations />}
                <DataInfo />
                {rawDataMetaInfo.length > 0 && <Advice />}
                {dataPreviewMode === IDataPreviewMode.data && <DataTable />}
                {dataPreviewMode === IDataPreviewMode.meta && <MetaView />}
                {dataPreviewMode === IDataPreviewMode.stat && <ProfilingView />}
            </div>
        </div>
    );
};

export default observer(DataSourceBoard);
