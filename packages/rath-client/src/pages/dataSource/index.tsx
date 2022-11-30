import React, { useCallback, useEffect } from 'react';
import intl from 'react-intl-universal';
import {
    PrimaryButton,
    Stack,
    DefaultButton,
    IconButton,
    ProgressIndicator,
    Pivot,
    PivotItem,
    MessageBar,
} from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from '../../store';
import { IDataPrepProgressTag, IDataPreviewMode, IMuteFieldBase, IRow } from '../../interfaces';
import { Card } from '../../components/card';
import { setDataStorage } from '../../utils/storage';
import { BorderCard } from '../../components/borderCard';
import DataTable from './dataTable/index';
import MetaView from './metaView/index';
import Selection from './selection/index';
import ImportStorage from './importStorage';
import Advice from './advice';
import AnalysisSettings from './settings';
import FastSelection from './fastSelection';
import ProfilingView from './profilingView';
import MainActionButton from './baseActions/mainActionButton';
import DataOperations from './baseActions/dataOperations';
import { initPatterns } from '../../lib/textPattern/init';

const MARGIN_LEFT = { marginLeft: '1em' };

interface DataSourceBoardProps {}

const DataSourceBoard: React.FC<DataSourceBoardProps> = (props) => {
    const { dataSourceStore, commonStore } = useGlobalStore();

    const {
        cleanedData,
        rawDataMetaInfo,
        filteredDataMetaInfo,
        loading,
        showDataImportSelection,
        dataPreviewMode,
        dataPrepProgressTag,
    } = dataSourceStore;
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
                    iconProps={{ iconName: 'ExcelDocument' }}
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
        (fields: IMuteFieldBase[], dataSource: IRow[], name?: string) => {
            dataSourceStore.loadDataWithInferMetas(dataSource, fields);
            if (name) {
                dataSourceStore.setDatasetId(name);
                setDataStorage(name, fields, dataSource);
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
    // console.log(initPatterns)
    console.log(initPatterns([
        {
            str: 'Alice is 18 years old',
            startIndex: 0,
            endIndex: 5
        },
        {
            str: 'Bob is 17 years old',
            startIndex: 0,
            endIndex: 3
        }
    ]))
    return (
        <div className="content-container" style={{ position: 'relative' }}>
            <Card>
                <ImportStorage />
                <AnalysisSettings />
                <FastSelection />
                <Stack horizontal>
                    <MainActionButton />
                    {dataImportButton(intl.get('dataSource.importData.buttonName'), rawDataMetaInfo.length === 0)}
                    <IconButton
                        style={MARGIN_LEFT}
                        title={intl.get('function.importStorage.title')}
                        ariaLabel={intl.get('function.importStorage.title')}
                        iconProps={{ iconName: 'CloudUpload' }}
                        onClick={() => {
                            commonStore.setShowStorageModal(true);
                        }}
                    />

                    <IconButton
                        style={MARGIN_LEFT}
                        iconProps={{ iconName: 'Settings' }}
                        title={intl.get('common.settings')}
                        ariaLabel={intl.get('common.settings')}
                        onClick={() => {
                            commonStore.setShowAnalysisConfig(true);
                        }}
                    />

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
                {dataPrepProgressTag !== IDataPrepProgressTag.none && <ProgressIndicator label={dataPrepProgressTag} />}
                {/* <Stack horizontal verticalAlign="end" style={{ margin: '1em 0px' }}>
                    <Dropdown
                        styles={{ root: { minWidth: '180px' } }}
                        selectedKey={cleanMethod}
                        label={intl.get('dataSource.cleanMethod')}
                        options={cleanMethodListLang}
                        onChange={(e, option) => {
                            option && dataSourceStore.setCleanMethod(option.key as CleanMethod);
                        }}
                        onRenderLabel={makeRenderLabelHandler(intl.get('dataSource.tip'))}
                    />
                </Stack> */}
                <hr style={{ margin: '1em 0em'}} />
                <Pivot
                    style={{ marginBottom: '6px' }}
                    selectedKey={dataPreviewMode}
                    onLinkClick={(item) => {
                        item && dataSourceStore.setDataPreviewMode(item.props.itemKey as IDataPreviewMode);
                    }}
                >
                    <PivotItem
                        itemKey={IDataPreviewMode.data}
                        headerText={intl.get('dataSource.dataView')}
                        itemIcon="Table"
                    />
                    <PivotItem
                        itemKey={IDataPreviewMode.meta}
                        headerText={intl.get('dataSource.metaView')}
                        itemIcon="ViewList"
                    />
                    <PivotItem
                        itemKey={IDataPreviewMode.stat}
                        headerText={intl.get('dataSource.statView')}
                        itemIcon="BarChartVerticalFilter"
                    />
                </Pivot>
                <BorderCard>
                    {rawDataMetaInfo.length > 0 && <DataOperations />}
                    <MessageBar>
                        {intl.get('dataSource.rowsInViews', {
                            origin: rawDataMetaInfo.length,
                            select: filteredDataMetaInfo.length,
                            clean: cleanedData.length,
                        })}
                    </MessageBar>
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
