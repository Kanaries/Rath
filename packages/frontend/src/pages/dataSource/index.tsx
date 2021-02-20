import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import intl from 'react-intl-universal'
import { useGlobalState } from "../../state";
import { useComposeState } from '../../utils/index';
import { ComboBox, PrimaryButton, IconButton, Stack, DefaultButton } from 'office-ui-fabric-react';
// import DataTable from '../../components/table';
import DataTable from './dataTable/index';
import FieldPanel from '../../components/fieldConfig';
import {  cleanMethodList, CleanMethod } from './clean';
import { useDataSource } from './useDataSource';
import Selection from './selection/index';
import { BIFieldType, Record } from "../../global";
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
  const [state, updateState, dispatch] = useGlobalState();
  const [pageStatus, setPageStatus] = useComposeState<PageStatus>({
    show: {
      insightBoard: false,
      fieldConfig: false,
      configPanel: false,
      dataConfig: false
    }
  })
  const [cleanMethod, setCleanMethod] = useState<CleanMethod>('dropNull');

  const dataSetting = useRef<HTMLDivElement>(null);

  const [dataSource, preparedData] = useDataSource(state.rawData, state.fields, cleanMethod);


  const cleanMethodListLang = useMemo<typeof cleanMethodList>(() => {
    return cleanMethodList.map(m => {
      return {
        key: m.key,
        text: intl.get(`dataSource.methods.${m.key}`)
      }
    })
  }, [state.lang])

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

  const updateFieldBIType = useCallback((type: BIFieldType, fieldKey: string) => {
    updateState(draft => {
      const target = draft.fields.find(f => f.name === fieldKey);
      if (target) {
        target.type = type;
      }
    })
  }, []);

  useEffect(() => {
    if (dataSource && dataSource.length === 0) {
      setPageStatus(draft => {
        draft.show.dataConfig = true;
      })
    }
    // 不要加依赖，这里是应用加载第一次时的判断逻辑！
  }, [])

  return (
    <div className="content-container">
      <FieldPanel
        fields={state.fields}
        show={pageStatus.show.fieldConfig}
        onUpdateConfig={(fields) => {
          updateState((draft) => {
            draft.fields = fields
          })
        }}
        onClose={() => {
          setPageStatus((draft) => {
            draft.show.fieldConfig = false
          })
        }}
      />
      <div className="card">
        <Stack horizontal>
          <PrimaryButton
            disabled={dataSource.length === 0}
            iconProps={{ iconName: 'Financial' }}
            text={intl.get('dataSource.extractInsight')}
            onClick={() => {
              dispatch('extractInsights', {
                dataSource: preparedData,
                fields: state.fields,
              })
              props.onExtractInsights()
            }}
          />
          { dataImportButton(intl.get('dataSource.importData.buttonName'), dataSource) }
          <div ref={dataSetting}>
            <IconButton
              iconProps={{ iconName: 'ExcelDocument' }}
              title="Upload"
              ariaLabel="upload data"
              onClick={() => {
                setPageStatus((draft) => {
                  draft.show.dataConfig = true
                })
              }}
            />
          </div>
          <Selection show={pageStatus.show.dataConfig}
              onClose={() => {
                setPageStatus(draft => {
                  draft.show.dataConfig = false;
                })
              }}
              onDataLoaded={(fields, dataSource) => {
                updateState(draft => {
                  draft.fields = fields;
                  draft.rawData = dataSource;
                })
              }}
          />
          <IconButton
            iconProps={{ iconName: 'Settings' }}
            title="Field Setting"
            ariaLabel="field setting"
            onClick={() => {
              setPageStatus((draft) => {
                draft.show.fieldConfig = true
              })
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
              option && setCleanMethod(option.key as CleanMethod)
            }}
          />
        </div>
        <p style={{ fontSize: 12, fontWeight: 400, color: '#595959' }}>{intl.get('dataSource.tip')}</p>
        <i style={{ fontSize: 12, fontWeight: 300, color: '#595959' }}>
          {intl.get('dataSource.recordCount', { count: preparedData.length })}
        </i>
        <DataTable fields={state.fields} dataSource={preparedData} onChangeBIType={updateFieldBIType} />
      </div>
    </div>
  )
};

export default DataSourceBoard;
