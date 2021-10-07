import React, {  useCallback, useEffect } from "react";
import intl from 'react-intl-universal'
import { useComposeState } from '../../hooks/index';
import { ComboBox, PrimaryButton, Stack, DefaultButton } from 'office-ui-fabric-react';
// import DataTable from '../../components/table';
import DataTable from './dataTable/index';
import { CleanMethod, useCleanMethodList } from './clean';
import Selection from './selection/index';
import { Record } from "../../global";
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from "../../store";
import { PIVOT_KEYS } from "../../constants";
interface PageStatus {
  show: {
    insightBoard: boolean;
    configPanel: boolean;
    fieldConfig: boolean;
    dataConfig: boolean;
  }
}

const MARGIN_LEFT = { marginLeft: "1em" }

interface DataSourceBoardProps {
}

const DataSourceBoard: React.FC<DataSourceBoardProps> = (props) => {
  const { dataSourceStore, pipeLineStore, commonStore, ltsPipeLineStore, exploreStore } = useGlobalStore();

  const { cleanedData, cleanMethod, rawData } = dataSourceStore;
  const [pageStatus, setPageStatus] = useComposeState<PageStatus>({
    show: {
      insightBoard: false,
      fieldConfig: false,
      configPanel: false,
      dataConfig: false
    }
  })

  const cleanMethodListLang = useCleanMethodList();

  const dataImportButton = useCallback((text: string, dataSource: Record[]) => {
    let UsedButton = dataSource.length === 0 ? PrimaryButton : DefaultButton;
    return (
      <UsedButton
        style={MARGIN_LEFT}
        iconProps={{ iconName: "ExcelDocument" }}
        text={text}
        onClick={() => {
          setPageStatus((draft) => {
            draft.show.dataConfig = true;
          });
        }}
      />
    );
  }, [])

  useEffect(() => {
    if (rawData && rawData.length === 0) {
      setPageStatus(draft => {
        draft.show.dataConfig = true;
      })
    }
    // 不要加依赖，这里是应用加载第一次时的判断逻辑！
  }, [])

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

  // useEffect(() => {
  //   console.log('meta update')
  //   dataSourceStore.getFieldsMetas();
  // }, [fields, cleanedData])

  return (
    <div className="content-container">
      <div className="card">
        <Stack horizontal>
          <PrimaryButton
            disabled={rawData.length === 0}
            iconProps={{ iconName: 'Financial' }}
            text={intl.get('dataSource.extractInsight')}
            onClick={onV1EngineStart}
          />
          {dataImportButton(intl.get('dataSource.importData.buttonName'), rawData)}
          <DefaultButton
            style={MARGIN_LEFT}
            disabled={rawData.length === 0}
            iconProps={{ iconName: 'TestBeakerSolid' }}
            text={intl.get('dataSource.extractInsightOld')}
            onClick={onOrignEngineStart}
          />
          
          <Selection show={pageStatus.show.dataConfig}
            onClose={() => {
              setPageStatus(draft => {
                draft.show.dataConfig = false;
              })
            }}
            onDataLoaded={(fields, dataSource) => {
              dataSourceStore.loadData(fields, dataSource);
            }}
          />
        </Stack>
        <div style={{ margin: '20px 0px' }}>
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
        <DataTable />
      </div>
    </div>
  )
};

export default observer(DataSourceBoard);
