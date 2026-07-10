import React, { useCallback } from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../../store';
import { IDataPrepProgressTag, IDataPreviewMode, IMuteFieldBase, IRow } from '../../interfaces';
import { DataSourceTag, IDBMeta, setDataStorage } from '../../utils/storage';
import { notify } from '../../components/error';
import { RathIcon } from '../../components/icons';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
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
                <div className="flex flex-row items-center">
                    <MainActionButton />
                    <Button
                        variant={rawDataMetaInfo.length === 0 ? 'default' : 'secondary'}
                        onClick={() => {
                            dataSourceStore.setShowDataImportSelection(true);
                        }}
                        style={MARGIN_LEFT}
                        className="gap-1.5"
                    >
                        <RathIcon name="Database" />
                        {intl.get('dataSource.importData.buttonName')}
                    </Button>

                    {dataPrepProgressTag !== IDataPrepProgressTag.none && (
                        <div className="ml-[1em] flex items-center gap-2" aria-live="assertive">
                            <Spinner />
                            <span className="text-sm">{dataPrepProgressTag}</span>
                        </div>
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
                </div>
                <hr style={{ margin: '1em 0em 0em 0em' }} />
                <Tabs value={dataPreviewMode} onValueChange={(value) => dataSourceStore.setDataPreviewMode(value as IDataPreviewMode)}>
                    <TabsList>
                        <TabsTrigger value={IDataPreviewMode.data} className="gap-1.5">
                            <RathIcon name="Table" />
                            {intl.get('dataSource.dataView')}
                        </TabsTrigger>
                        <TabsTrigger value={IDataPreviewMode.meta} className="gap-1.5">
                            <RathIcon name="ViewList" />
                            {intl.get('dataSource.metaView')}
                        </TabsTrigger>
                        <TabsTrigger value={IDataPreviewMode.stat} className="gap-1.5">
                            <RathIcon name="AnalyticsView" />
                            {intl.get('dataSource.statView')}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
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
