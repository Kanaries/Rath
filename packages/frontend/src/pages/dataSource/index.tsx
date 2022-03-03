import React, {  useCallback, useEffect } from "react";
import intl from 'react-intl-universal'
import { ComboBox, PrimaryButton, Stack, DefaultButton, Dropdown, IDropdownOption, IContextualMenuProps, Toggle } from 'office-ui-fabric-react';
// import DataTable from '../../components/table';
import DataTable from './dataTable/index';
import MetaView from './metaView/index';
import { CleanMethod, useCleanMethodList } from './clean';
import Selection from './selection/index';
import ImportStorage from "./importStorage";
import { Record } from "../../global";
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from "../../store";
import { COMPUTATION_ENGINE, EXPLORE_MODE, PIVOT_KEYS } from "../../constants";
import { IDataPreviewMode, IMuteFieldBase, IRow } from "../../interfaces";

const MARGIN_LEFT = { marginLeft: "1em" }

interface DataSourceBoardProps {
}

const DataSourceBoard: React.FC<DataSourceBoardProps> = (props) => {
  const { dataSourceStore, pipeLineStore, commonStore, ltsPipeLineStore, exploreStore } = useGlobalStore();

  const { cleanedData, cleanMethod, rawData, loading, showDataImportSelection, dataPreviewMode } = dataSourceStore;

  useEffect(() => {
    // 注意！不要对useEffect加依赖rawData，因为这里是初始加载的判断。
    if (rawData && rawData.length === 0) {
      dataSourceStore.setShowDataImportSelection(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSourceStore])

  const cleanMethodListLang = useCleanMethodList();

  const dataImportButton = useCallback((text: string, dataSource: Record[]) => {
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
    ltsPipeLineStore.startTask().then(() => {
      exploreStore.emitViewChangeTransaction(0);
    })
    commonStore.setAppKey(PIVOT_KEYS.lts);
  }, [ltsPipeLineStore, exploreStore, commonStore])

  const onCheckResults = useCallback(() => {
    exploreStore.emitViewChangeTransaction(0)
    commonStore.setAppKey(PIVOT_KEYS.lts)
  }, [exploreStore, commonStore])

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

  const engineOptions: IDropdownOption[] = [
    { text: intl.get(`config.computationEngine.${COMPUTATION_ENGINE.clickhouse}`), key: COMPUTATION_ENGINE.clickhouse },
    { text: intl.get(`config.computationEngine.${COMPUTATION_ENGINE.webworker}`), key: COMPUTATION_ENGINE.webworker }
  ]
  const exploreOptions: IDropdownOption[] = [
    { text: intl.get('dataSource.exploreMode.firstTime'), key: EXPLORE_MODE.first },
    { text: intl.get('dataSource.exploreMode.familiar'), key: EXPLORE_MODE.familiar },
    { text: intl.get('dataSource.exploreMode.comprehensive'), key: EXPLORE_MODE.comprehensive }
  ]
  const analysisOptions: IContextualMenuProps = {
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
      }
    ]
  }

  const hasResults = exploreStore.insightSpaces.length > 0;

  // useEffect(() => {
  //   console.log('meta update')
  //   dataSourceStore.getFieldsMetas();
  // }, [fields, cleanedData])

  return (
    <div className="content-container">
      <div className="card">
        <ImportStorage />
        <Stack horizontal>
          <PrimaryButton
            split
            disabled={rawData.length === 0}
            iconProps={{ iconName: 'Financial' }}
            text={intl.get(`function.analysis.${hasResults ? 'checkResult' : 'start'}`)}
            menuProps={analysisOptions}
            onClick={hasResults ? onCheckResults : onV1EngineStart}
          />
          {dataImportButton(intl.get('dataSource.importData.buttonName'), rawData)}
          <DefaultButton
            style={MARGIN_LEFT}
            text={intl.get('function.importStorage.title')}
            iconProps={{ iconName: 'CloudUpload' }}
            onClick={() => {
              commonStore.setShowStorageModal(true)
            }}
          />
          <DefaultButton
            style={MARGIN_LEFT}
            disabled={rawData.length === 0}
            iconProps={{ iconName: 'TestBeakerSolid' }}
            text={intl.get('dataSource.extractInsightOld')}
            onClick={onOrignEngineStart}
          />
          
          <Selection show={showDataImportSelection}
            loading={loading}
            onClose={onSelectPannelClose}
            onDataLoaded={onSelectDataLoaded}
            onStartLoading={onSelectStartLoading}
            onLoadingFailed={onSelectLoadingFailed}
          />
        </Stack>
        <div style={{ margin: '1em 0px' }}>
          <Stack horizontal>
            <Dropdown style={{ minWidth: '180px', marginRight: '1em' }}
                selectedKey={commonStore.computationEngine}
                options={engineOptions}
                label={intl.get('config.computationEngine.title')}
                onChange={(e, item) => {
                  item && commonStore.setComputationEngine(item.key as string);
                }}
              />
              <Dropdown style={{ minWidth: '180px', marginRight: '1em' }}
                disabled
                selectedKey={commonStore.exploreMode}
                options={exploreOptions}
                label={intl.get('dataSource.exploreMode.title')}
                onChange={(e, item) => {
                  item && commonStore.setExploreMode(item.key as string);
                }}
              />
          </Stack>
        </div>
        <div style={{ margin: '1em 0px' }}>
          <ComboBox
            styles={{ root: { maxWidth: '180px' } }}
            selectedKey={cleanMethod}
            label={intl.get('dataSource.cleanMethod')}
            allowFreeform={true}
            autoComplete="on"
            options={cleanMethodListLang}
            onChange={(e, option) => {
              option && dataSourceStore.setCleanMethod(option.key as CleanMethod)
            }}
          />
        </div>
        <p style={{ fontSize: 12, fontWeight: 400, color: '#595959' }}>{intl.get('dataSource.tip')}</p>
        <i style={{ fontSize: 12, fontWeight: 300, color: '#595959' }}>
          {intl.get('dataSource.recordCount', { count: cleanedData.length })} <br />
          Origin: ({rawData.length}) rows / Clean: ({cleanedData.length}) rows
        </i>
        <Toggle checked={dataPreviewMode === IDataPreviewMode.meta}
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
      </div>
    </div>
  )
};

export default observer(DataSourceBoard);
