import React, { useCallback, useEffect, useMemo } from "react";
import intl from 'react-intl-universal'
import { PrimaryButton, Stack, DefaultButton, Dropdown, IContextualMenuProps, Toggle, IContextualMenuItem, IconButton, CommandButton, ProgressIndicator } from 'office-ui-fabric-react';
import DataTable from './dataTable/index';
import MetaView from './metaView/index';
import { useCleanMethodList } from '../../hooks';
import Selection from './selection/index';
import ImportStorage from "./importStorage";
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from "../../store";
import { EXPLORE_MODE, PIVOT_KEYS } from "../../constants";
import { CleanMethod, IDataPrepProgressTag, IDataPreviewMode, IMuteFieldBase, IRow } from "../../interfaces";
import { Card } from "../../components/card";
import Advice from "./advice";
import AnalysisSettings from './settings'
import FastSelection from "./fastSelection";
import { makeRenderLabelHandler } from "../../components/labelTooltip";

const MARGIN_LEFT = { marginLeft: "1em" }

interface DataSourceBoardProps {
}

const DataSourceBoard: React.FC<DataSourceBoardProps> = (props) => {
  const { dataSourceStore, pipeLineStore, commonStore, ltsPipeLineStore, exploreStore } = useGlobalStore();

  const {
    cleanedData,
    cleanMethod,
    rawData,
    filteredData,
    loading,
    showDataImportSelection,
    dataPreviewMode,
    staisfyAnalysisCondition,
    dataPrepProgressTag
  } = dataSourceStore;

  const { exploreMode, taskMode } = commonStore;

  useEffect(() => {
    // 注意！不要对useEffect加依赖rawData，因为这里是初始加载的判断。
    if (rawData && rawData.length === 0) {
      dataSourceStore.setShowDataImportSelection(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSourceStore])

  const cleanMethodListLang = useCleanMethodList();

  const dataImportButton = useCallback((text: string, dataSource: IRow[]) => {
    let UsedButton = dataSource.length === 0 ? PrimaryButton : DefaultButton;
    return (
      <UsedButton
        style={MARGIN_LEFT}
        iconProps={{ iconName: "ExcelDocument" }}
        text={text}
        onClick={() => {
          dataSourceStore.setShowDataImportSelection(true)
        }}
      />
    );
  }, [dataSourceStore])

  const onOrignEngineStart = useCallback(() => {
    pipeLineStore.startTask();
    commonStore.setAppKey(PIVOT_KEYS.gallery);
  }, [commonStore, pipeLineStore])

  const onV1EngineStart = useCallback(() => {
    ltsPipeLineStore.startTask(taskMode).then(() => {
      exploreStore.emitViewChangeTransaction(0);
    })
    commonStore.setAppKey(PIVOT_KEYS.lts);
  }, [ltsPipeLineStore, exploreStore, commonStore, taskMode])

  const onCheckResults = useCallback(() => {
    exploreStore.emitViewChangeTransaction(0)
    commonStore.setAppKey(PIVOT_KEYS.lts)
  }, [exploreStore, commonStore])

  const onBuildKnowledge = useCallback(() => {
    commonStore.setAppKey(PIVOT_KEYS.pattern)
  }, [commonStore])

  const onSelectPannelClose = useCallback(() => {
    dataSourceStore.setShowDataImportSelection(false)
  }, [dataSourceStore])

  const onSelectDataLoaded = useCallback((fields: IMuteFieldBase[], dataSource: IRow[]) => {
    // dataSourceStore.loadData(fields, dataSource);
    dataSourceStore.loadDataWithInferMetas(dataSource, fields);
  }, [dataSourceStore])

  const onSelectStartLoading = useCallback(() => {
    dataSourceStore.setLoading(true);
  }, [dataSourceStore])

  const onSelectLoadingFailed = useCallback((err: any) => {
    dataSourceStore.setLoading(false);
    commonStore.showError('error', `[Data Loading Error]${err}`)
  }, [dataSourceStore, commonStore])

  const analysisOptions: IContextualMenuProps = useMemo(() => {
    return {
      items: [
        {
          key: 'function.analysis.start',
          text: intl.get('function.analysis.start'),
          onClick: onV1EngineStart
        },
        {
          key: 'function.analysis.checkResult',
          text: intl.get('function.analysis.checkResult'),
          onClick: onCheckResults
        },
        {
          key: 'function.analysis.pattern',
          text: intl.get('function.analysis.pattern'),
          onClick: onBuildKnowledge
        },
        {
          key: 'function.analysis.manual',
          text: intl.get('function.analysis.manual'),
          onClick: () => {
            commonStore.setAppKey(PIVOT_KEYS.editor)
          }
        }
      ]
    }
  }, [onV1EngineStart, onCheckResults, onBuildKnowledge, commonStore])

  const hasResults = exploreStore.insightSpaces.length > 0;

  const startMode = useMemo<IContextualMenuItem>(() => {
    if (exploreMode === EXPLORE_MODE.first) {
      return analysisOptions.items[2];
    }
    if (exploreMode === EXPLORE_MODE.manual) {
      return analysisOptions.items[3]
    }
    if (hasResults) {
      return analysisOptions.items[1]
    }
    return analysisOptions.items[0]
  }, [hasResults, exploreMode, analysisOptions])

  const exportData = useCallback(() => {
    const ds = dataSourceStore.exportDataAsDSService()
    const content = JSON.stringify(ds);
    const ele = document.createElement('a');
    ele.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    ele.setAttribute('download', 'dataset-service.json')
    ele.style.display = 'none';
    document.body.appendChild(ele)
    ele.click();

    document.body.removeChild(ele);

  }, [dataSourceStore])

  const onDataLoading = useCallback((p: number) => {
    dataSourceStore.setLoadingDataProgress(Math.floor(p * 100) / 100)
  }, [dataSourceStore])

  return (
    <div className="content-container">
      <Card>
        <ImportStorage />
        <AnalysisSettings />
        <FastSelection />
        <Stack horizontal>
          <PrimaryButton
            split
            disabled={!staisfyAnalysisCondition}
            iconProps={{ iconName: 'Financial' }}
            text={intl.get(`${startMode.key}`)}
            menuProps={analysisOptions}
            onClick={() => { startMode.onClick && startMode.onClick() }}
          />
          {dataImportButton(intl.get('dataSource.importData.buttonName'), rawData)}
          <IconButton
            style={MARGIN_LEFT}
            title={intl.get('function.importStorage.title')}
            ariaLabel={intl.get('function.importStorage.title')}
            iconProps={{ iconName: 'CloudUpload' }}
            onClick={() => {
              commonStore.setShowStorageModal(true)
            }}
          />
          <IconButton
            style={MARGIN_LEFT}
            disabled={rawData.length === 0}
            iconProps={{ iconName: 'TestBeakerSolid' }}
            title={intl.get('dataSource.extractInsightOld')}
            ariaLabel={intl.get('dataSource.extractInsightOld')}
            onClick={onOrignEngineStart}
          />

          <IconButton
            style={MARGIN_LEFT}
            iconProps={{ iconName: 'Settings' }}
            title={intl.get('dataSource.extractInsightOld')}
            ariaLabel={intl.get('dataSource.extractInsightOld')}
            onClick={() => {
              commonStore.setShowAnalysisConfig(true)
            }}
          />

          <Selection show={showDataImportSelection}
            onDataLoading={onDataLoading}
            loading={loading}
            onClose={onSelectPannelClose}
            onDataLoaded={onSelectDataLoaded}
            onStartLoading={onSelectStartLoading}
            onLoadingFailed={onSelectLoadingFailed}
          />
        </Stack>
        { rawData.length > 0 && <Advice onForceAnalysis={() => { startMode.onClick && startMode.onClick() }} /> }
        { dataPrepProgressTag !== IDataPrepProgressTag.none && <ProgressIndicator label={dataPrepProgressTag} />}
        <Stack horizontal verticalAlign="end" style={{ margin: '1em 0px' }}>
          <Dropdown
            styles={{ root: { minWidth: '180px' } }}
            selectedKey={cleanMethod}
            label={intl.get('dataSource.cleanMethod')}
            options={cleanMethodListLang}
            onChange={(e, option) => {
              option && dataSourceStore.setCleanMethod(option.key as CleanMethod)
            }}
            onRenderLabel={makeRenderLabelHandler(intl.get('dataSource.tip'))}
          />
        </Stack>
        <Stack horizontal  style={{ margin: '1em 0px' }}>
          <CommandButton
            disabled={rawData.length === 0}
            text={intl.get('dataSource.fastSelection.title')}
            iconProps={{ iconName: 'filter' }}
            onClick={() => {
              dataSourceStore.setShowFastSelection(true)
            }}
          />
          <CommandButton
              text={intl.get('dataSource.downloadData.title')}
              disabled={rawData.length === 0}
              onClick={exportData}
              iconProps={{ iconName: 'download' }}
            />
            <CommandButton
              text={intl.get('dataSource.extend.title')}
              disabled={rawData.length === 0}
              iconProps={{ iconName: 'AppIconDefaultAdd' }}
              onClick={() => {
                // dataSourceStore.extendData();
                // TODO: 更多的扩展方式
                dataSourceStore.expandDateTime();
              }}
            />
        </Stack>
        <i style={{ fontSize: 12, fontWeight: 300, color: '#595959' }}>
          {intl.get('dataSource.recordCount', { count: cleanedData.length })} <br />
          Origin: ({rawData.length}) rows / Selected: ({ filteredData.length }) / Clean: ({cleanedData.length}) rows
        </i>
        <Toggle checked={dataPreviewMode === IDataPreviewMode.meta}
          disabled={rawData.length === 0}
          label={intl.get('dataSource.viewMode')}
          onText={intl.get('dataSource.metaView')}
          offText={intl.get('dataSource.dataView')}
          onChange={(ev, checked) => {
            dataSourceStore.setDataPreviewMode(checked ? IDataPreviewMode.meta : IDataPreviewMode.data)
          }}
        />
        {/* <ActionButton iconProps={{ iconName: 'download' }}>download data</ActionButton> */}
        {
          dataPreviewMode === IDataPreviewMode.data && <DataTable />
        }
        {
          dataPreviewMode === IDataPreviewMode.meta && <MetaView />
        }
      </Card>
    </div>
  )
};

export default observer(DataSourceBoard);
