import React, { useState, useRef } from "react";
import { useGlobalState } from "../../state";
import { FileLoader, useComposeState } from '../../utils/index';
import { ComboBox, DefaultButton, IconButton, Callout, Stack, CommandBar } from 'office-ui-fabric-react';
import DataTable from '../../components/table';
import FieldPanel from '../../components/fieldConfig';
import { DataSource,  BIField } from '../../global';
import {  cleanMethodList, CleanMethod } from './clean';
import { Cleaner } from 'visual-insights';
import { useDataSource } from './useDataSource';

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

  const dataSetting = useRef<HTMLDivElement>(null);
  const fileEle = useRef<HTMLInputElement>(null);

  const [dataSource, preparedData] = useDataSource(state.rawData, state.fields, cleanMethod);

  async function fileUploadHanlder () {
    if (fileEle.current !== null && fileEle.current.files !== null) {
      const file = fileEle.current.files[0];
      /**
       * tmpFields is fields cat by specific rules, the results is not correct sometimes, waitting for human's input
       */
      let tmpFields: BIField[] = [];
      let rawData: DataSource = [];

      if (file.type === 'text/csv') {
        rawData = await FileLoader.csvLoader(file);
      } else if (file.type === 'application/json' || file.type === 'application/vnd.ms-excel') {
        rawData = await FileLoader.jsonLoader(file);
      } else {
        throw new Error(`unsupported file type=${file.type} `)
      }
      rawData = Cleaner.dropNullColumn(rawData, Object.keys(rawData[0])).dataSource;
      tmpFields = Object.keys(rawData[0]).map(fieldName => {
        return {
          name: fieldName,
          type: rawData.every(row => {
            return !isNaN(row[fieldName]) || row[fieldName] === undefined;
          }) ? 'measure' : 'dimension'
        }
      });
      updateState(draft => {
        draft.fields = tmpFields;
        draft.rawData = rawData;
      })
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
          <DefaultButton
            disabled={dataSource.length === 0}
            iconProps={{ iconName: "Financial" }}
            text="Extract Insights"
            onClick={() => {
              dispatch('extractInsights', {
                dataSource: preparedData,
                fields: state.fields
              })
              props.onExtractInsights();
            }}
          />
          <div ref={dataSetting}>
            <IconButton
              iconProps={{ iconName: "ExcelDocument" }}
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
                    .csv, .json, .txt are supportted.
                  </p>
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
