import { useCallback, useState } from 'react';
import type { FC } from 'react';
import intl from 'react-intl-universal';
import { Stack, Spinner } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { Button, Tab, TabList } from '@fluentui/react-components';
import { List, BarChart3, Database, Table } from 'lucide-react';
import { useGlobalStore } from '../../store';
import { IDataPrepProgressTag, IDataPreviewMode } from '../../interfaces';
import { useDataImportCallbacks } from '../../hooks/useDataImportCallbacks';
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
import InsightCoach from './insightCoach';
import DataAssistant from './dataAssistant';

const MARGIN_LEFT = { marginLeft: '1em' };

const DataSourceBoard: FC = () => {
    const { dataSourceStore } = useGlobalStore();

    const { rawDataMetaInfo, showDataImportSelection, dataPreviewMode, dataPrepProgressTag } = dataSourceStore;

    const onSelectPannelClose = useCallback(() => {
        dataSourceStore.setShowDataImportSelection(false);
    }, [dataSourceStore]);

    const {
        onSelectDataLoaded,
        onSelectStartLoading,
        onLoadingFailed: onSelectLoadingFailed,
        toggleLoadingAnimation,
        onDataLoading,
        loading,
    } = useDataImportCallbacks({ onClose: onSelectPannelClose });
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
                        icon={<Database />}
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
                <TabList
                    selectedValue={dataPreviewMode}
                    onTabSelect={(_e, item) => {
                        item.value && dataSourceStore.setDataPreviewMode(item.value as IDataPreviewMode);
                    }}
                >
                    <Tab value={IDataPreviewMode.data} icon={<Table />}>
                        {intl.get('dataSource.dataView')}
                    </Tab>
                    <Tab value={IDataPreviewMode.meta} icon={<List />}>
                        {intl.get('dataSource.metaView')}
                    </Tab>
                    <Tab value={IDataPreviewMode.stat} icon={<BarChart3 />}>
                        {intl.get('dataSource.statView')}
                    </Tab>
                </TabList>
                {rawDataMetaInfo.length > 0 && <DataOperations />}
                <DataInfo />
                {rawDataMetaInfo.length > 0 && <Advice />}
                <DataAssistant />
                <InsightCoach />
                {dataPreviewMode === IDataPreviewMode.data && <DataTable />}
                {dataPreviewMode === IDataPreviewMode.meta && <MetaView />}
                {dataPreviewMode === IDataPreviewMode.stat && <ProfilingView />}
            </div>
        </div>
    );
};

export default observer(DataSourceBoard);
