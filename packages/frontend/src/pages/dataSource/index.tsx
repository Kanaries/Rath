import React, {  useCallback, useEffect } from "react";
import intl from 'react-intl-universal'
import { useComposeState } from '../../utils/index';
import { ComboBox, PrimaryButton, Stack, DefaultButton } from 'office-ui-fabric-react';
// import DataTable from '../../components/table';
import DataTable from './dataTable/index';
import { CleanMethod, useCleanMethodList } from './clean';
import Selection from './selection/index';
import { BIFieldType, Record } from "../../global";
import { observer } from 'mobx-react-lite';
import { useGlobalStore } from "../../store";
import { IRawField } from "../../interfaces";
interface PageStatus {
  show: {
    insightBoard: boolean;
    configPanel: boolean;
    fieldConfig: boolean;
    dataConfig: boolean;
  }
}

interface DataSourceBoardProps {
  onExtractInsights: () => void;
}

const DataSourceBoard: React.FC<DataSourceBoardProps> = (props) => {
  const { dataSourceStore, pipeLineStore } = useGlobalStore();

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
        style={{ marginLeft: "10px" }}
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
            onClick={() => {
              // dispatch('extractInsights', {
              //   dataSource: preparedData,
              //   fields: state.fields,
              // })
              pipeLineStore.startTask();
              props.onExtractInsights()
            }}
          />
          {dataImportButton(intl.get('dataSource.importData.buttonName'), rawData)}
          
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
