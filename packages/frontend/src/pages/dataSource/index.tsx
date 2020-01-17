import React, { useState, useRef } from "react";
import { useGlobalState } from "../../state";
import { FileLoader, useComposeState } from '../../utils/index';
import { ComboBox, PrimaryButton, IconButton, Callout, Stack, CommandBar, ChoiceGroup, IChoiceGroupOption, Slider, Label, Checkbox } from 'office-ui-fabric-react';
import DataTable from '../../components/table';
import FieldPanel from '../../components/fieldConfig';
import { DataSource,  BIField, Record } from '../../global';
import {  cleanMethodList, CleanMethod } from './clean';
import { Cleaner, Sampling } from 'visual-insights';
import { useDataSource } from './useDataSource';
import { useId } from '@uifabric/react-hooks';

enum SampleKey {
  none = 'none',
  reservoir = 'reservoir',
}

const SampleOptions = [
  {
    key: SampleKey.none,
    text: 'none'
  },
  {
    key: SampleKey.reservoir,
    text: 'reservoir'
  }
];

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
  const [fixUnicodeField, setFixUnicodeField] = useState<boolean>(true);
  const [sampleMethod, setSampleMethod] = useState<SampleKey>(SampleKey.none)
  const [sampleSize, setSampleSize] = useState<number>(0.2);

  const dataSetting = useRef<HTMLDivElement>(null);
  const fileEle = useRef<HTMLInputElement>(null);

  const [dataSource, preparedData] = useDataSource(state.rawData, state.fields, cleanMethod);

  const labelId = useId('labelElement');

  async function fileUploadHanlder () {
    if (fileEle.current !== null && fileEle.current.files !== null) {
      const file = fileEle.current.files[0];
      /**
       * tmpFields is fields cat by specific rules, the results is not correct sometimes, waitting for human's input
       */
      let tmpFields: BIField[] = [];
      let rawData: DataSource = [];

      if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel') {
        rawData = await FileLoader.csvLoader(file);
      } else if (file.type === 'application/json') {
        rawData = await FileLoader.jsonLoader(file);
      } else {
        throw new Error(`unsupported file type=${file.type} `)
      }
      if (sampleMethod === SampleKey.reservoir) {
        rawData = Sampling.reservoirSampling(rawData, Math.round(rawData.length * sampleSize));
      }
      rawData = Cleaner.dropNullColumn(rawData, Object.keys(rawData[0])).dataSource;
      let keys = Object.keys(rawData[0]);
      tmpFields = keys.map((fieldName, index) => {
        return {
          name: fieldName,
          type: rawData.every(row => {
            return !isNaN(row[fieldName]) || row[fieldName] === undefined;
          }) ? 'measure' : 'dimension'
        }
      });
      if (fixUnicodeField) {
        tmpFields.forEach((f, i) => {
          f.name = `${f.name}-rid-${i}`
        })
        rawData = rawData.map(record => {
          let fixedRecord: Record = {};
          for (let i = 0; i < keys.length; i++) {
            fixedRecord[tmpFields[i].name] = record[keys[i]]
          }
          return fixedRecord
        })
      }
      updateState(draft => {
        draft.fields = tmpFields;
        draft.rawData = rawData;
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
      name: 'Upload',
      iconProps: { iconName: 'Upload' },
      onClick: () => {
        if (fileEle.current) {
          fileEle.current.click();
        }
      }
    }
  ]

  return (
    <div className="content-container">
      <FieldPanel
        fields={state.fields}
        show={pageStatus.show.fieldConfig}
        onUpdateConfig={fields => {
          updateState(draft => {
            draft.fields = fields;
          });
        }}
        onClose={() => {
          setPageStatus(draft => {
            draft.show.fieldConfig = false;
          });
        }}
      />
      <div className="card">
        <Stack horizontal>
          <PrimaryButton
            disabled={dataSource.length === 0}
            iconProps={{ iconName: "Financial" }}
            text="Extract Insights"
            onClick={() => {
              dispatch("extractInsights", {
                dataSource: preparedData,
                fields: state.fields
              });
              props.onExtractInsights();
            }}
          />
          <div ref={dataSetting}>
            <IconButton
              iconProps={{ iconName: "ExcelDocument" }}
              title="Upload"
              ariaLabel="upload data"
              onClick={() => {
                setPageStatus(draft => {
                  draft.show.dataConfig = true;
                });
              }}
            />
            <Callout
              style={{ maxWidth: 300 }}
              className="vi-callout-callout"
              role="alertdialog"
              gapSpace={0}
              target={dataSetting.current}
              onDismiss={() => {
                setPageStatus(draft => {
                  draft.show.dataConfig = false;
                });
              }}
              setInitialFocus={true}
              hidden={!pageStatus.show.dataConfig}
            >
              <div className="vi-callout-header">
                <p className="vi-callout-title">Upload Your own dataset</p>
              </div>
              <div className="vi-callout-inner">
                <div className="vi-callout-content">
                  <p className="vi-callout-subTex">
                    .csv, .json are supportted.
                  </p>
                </div>
                <div>
                  <Checkbox
                    label="Add unique ids for fields"
                    checked={fixUnicodeField}
                    onChange={(
                      ev?: React.FormEvent<HTMLElement>,
                      checked?: boolean
                    ) => {
                      setFixUnicodeField(!!checked);
                    }}
                  />
                  <Label id={labelId} required={true}>
                    Sampling
                  </Label>
                  <ChoiceGroup
                    defaultSelectedKey="B"
                    options={SampleOptions}
                    selectedKey={sampleMethod}
                    onChange={(
                      ev: any,
                      option: IChoiceGroupOption | undefined
                    ) => {
                      if (option) {
                        setSampleMethod(option.key as SampleKey);
                      }
                    }}
                    ariaLabelledBy={labelId}
                  />
                  {sampleMethod !== SampleKey.none && (
                    <Slider
                      label="sample size(percent)"
                      min={0}
                      max={1}
                      step={0.001}
                      value={sampleSize}
                      showValue={true}
                      valueFormat={(value: number) =>
                        `${(value * 100).toFixed(1)}%`
                      }
                      onChange={(val: number) => {
                        setSampleSize(val);
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
                    style={{ display: "none" }}
                    onChange={fileUploadHanlder}
                  />
                  <CommandBar
                    overflowButtonProps={{ name: "More" }}
                    items={commandBarList}
                  />
                </div>
              </div>
            </Callout>
          </div>
          <IconButton
            iconProps={{ iconName: "Settings" }}
            title="Field Setting"
            ariaLabel="field setting"
            onClick={() => {
              setPageStatus(draft => {
                draft.show.fieldConfig = true;
              });
            }}
          />
        </Stack>
        <div style={{ margin: "20px 0px" }}>
          <ComboBox
            styles={{ root: { maxWidth: "180px" } }}
            selectedKey={cleanMethod}
            label="Clean Method"
            allowFreeform={true}
            autoComplete="on"
            options={cleanMethodList}
            onChange={(e, option) => {
              option && setCleanMethod(option.key as CleanMethod);
            }}
          />
        </div>
        <p style={{ fontSize: 12, fontWeight: 400, color: "#595959" }}>
          Remember to adjust the fields' types and cleaning strategy before
          extracting insights.
        </p>
        <i style={{ fontSize: 12, fontWeight: 300, color: "#595959" }}>
          Number of records {preparedData.length}
        </i>
        <DataTable fields={state.fields} dataSource={preparedData} />
      </div>
    </div>
  );
};

export default DataSourceBoard;
