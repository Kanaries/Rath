import React, { useState, useRef, useMemo } from "react";
import intl from 'react-intl-universal'
import { useGlobalState } from "../../state";
import { useComposeState } from '../../utils/index';
import { ComboBox, PrimaryButton, IconButton, Callout, Stack, CommandBar, ChoiceGroup, IChoiceGroupOption, Label, SpinButton } from 'office-ui-fabric-react';
import DataTable from '../../components/table';
import FieldPanel from '../../components/fieldConfig';
import {  cleanMethodList, CleanMethod } from './clean';
import { useDataSource } from './useDataSource';
import { useId } from '@uifabric/react-hooks';
import { loadDataFile, SampleKey, SampleOptions } from "./utils";

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

const DataSourceLoggerURL =
  'https://1423108296428281.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/Rath/dataSourceLogger/';


const DataSourceBoard: React.FC<DataSourceBoardProps> = (props) => {
  const [state,updateState, dispatch] = useGlobalState();
  const [pageStatus, setPageStatus] = useComposeState<PageStatus>({
    show: {
      insightBoard: false,
      fieldConfig: false,
      configPanel: false,
      dataConfig: false
    }
  })
  const [cleanMethod, setCleanMethod] = useState<CleanMethod>('dropNull');
  const [sampleMethod, setSampleMethod] = useState<SampleKey>(SampleKey.none)
  const [sampleSize, setSampleSize] = useState<number>(500);

  const dataSetting = useRef<HTMLDivElement>(null);
  const fileEle = useRef<HTMLInputElement>(null);

  const [dataSource, preparedData] = useDataSource(state.rawData, state.fields, cleanMethod);

  const labelId = useId('labelElement');

  async function fileUploadHanlder () {
    if (fileEle.current !== null && fileEle.current.files !== null) {
      const file = fileEle.current.files[0];
      const { fields, dataSource } = await loadDataFile(file, sampleMethod, sampleSize)
      fetch(DataSourceLoggerURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields,
          dataSource: dataSource.slice(0, 10)
        })
      }).then(res => res.json())
        .then(res => { console.log(res) })
      updateState(draft => {
        draft.fields = fields;
        draft.rawData = dataSource;
      })
      setPageStatus(draft => {
        draft.show.dataConfig = false;
      });
    }
  }
  // const analysisHandler = startAnalysis(preparedData, state.fields);

  const commandBarList = [
    {
      key: 'upload',
      name: intl.get('dataSource.upload.upload'),
      iconProps: { iconName: 'Upload' },
      onClick: () => {
        if (fileEle.current) {
          fileEle.current.click();
        }
      }
    }
  ]

  const cleanMethodListLang = useMemo<typeof cleanMethodList>(() => {
    return cleanMethodList.map(m => {
      return {
        key: m.key,
        text: intl.get(`dataSource.methods.${m.key}`)
      }
    })
  }, [state.lang])

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
            <Callout
              style={{ maxWidth: 300 }}
              className="vi-callout-callout"
              role="alertdialog"
              gapSpace={0}
              target={dataSetting.current}
              onDismiss={() => {
                setPageStatus((draft) => {
                  draft.show.dataConfig = false
                })
              }}
              setInitialFocus={true}
              hidden={!pageStatus.show.dataConfig}
            >
              <div className="vi-callout-header">
                <p className="vi-callout-title">{intl.get('dataSource.upload.title')}</p>
              </div>
              <div className="vi-callout-inner">
                <div className="vi-callout-content">
                  <p className="vi-callout-subTex">{intl.get('dataSource.upload.fileTypes')}</p>
                </div>
                <div>
                  <Label id={labelId} required={true}>
                    {intl.get('dataSource.upload.sampling')}
                  </Label>
                  <ChoiceGroup
                    defaultSelectedKey="B"
                    options={SampleOptions}
                    selectedKey={sampleMethod}
                    onChange={(ev: any, option: IChoiceGroupOption | undefined) => {
                      if (option) {
                        setSampleMethod(option.key as SampleKey)
                      }
                    }}
                    ariaLabelledBy={labelId}
                  />
                  {/* {sampleMethod !== SampleKey.none && (
                    <Slider
                      label={intl.get('dataSource.upload.percentSize')}
                      min={0}
                      max={1}
                      step={0.001}
                      value={sampleSize}
                      showValue={true}
                      valueFormat={(value: number) => `${(value * 100).toFixed(1)}%`}
                      onChange={(val: number) => {
                        setSampleSize(val)
                      }}
                    />
                  )} */}
                  {sampleMethod === SampleKey.reservoir && (
                    <SpinButton
                      label={intl.get('dataSource.upload.percentSize')}
                      min={0}
                      step={1}
                      value={sampleSize.toString()}
                      onValidate={(value) => {
                        setSampleSize(Number(value));
                      }}
                      onIncrement={() => {
                        setSampleSize(v => v + 1)
                      }}
                      onDecrement={() => {
                        setSampleSize(v => Math.max(v - 1, 0))
                      }}
                    />
                  )}
                </div>
                <div className="vi-callout-actions">
                  <input
                    type="file"
                    ref={fileEle}
                    multiple
                    accept="*"
                    style={{ display: 'none' }}
                    onChange={fileUploadHanlder}
                  />
                  <CommandBar overflowButtonProps={{ name: 'More' }} items={commandBarList} />
                </div>
              </div>
            </Callout>
          </div>
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
        <DataTable fields={state.fields} dataSource={preparedData} />
      </div>
    </div>
  )
};

export default DataSourceBoard;
