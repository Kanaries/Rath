import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGlobalState, GlobalStateProvider } from './state';
import { ComboBox, DefaultButton, IconButton, Callout, Stack, ProgressIndicator, Pivot, PivotItem, CommandBar, Toggle, setFocusVisibility } from 'office-ui-fabric-react';
import DataTable from './components/table';
import PreferencePanel, { PreferencePanelConfig } from './components/preference';
import FieldPanel from './components/fieldConfig';
import BaseChart from './demo/vegaBase';
import { FileLoader, useComposeState, deepcopy } from './utils/index';
import './App.css';

import {
  fieldsAnalysisService,
  getInsightViewsService, View,
  getFieldsSummaryService, FieldSummary,
  getGroupFieldsService,
  combineFieldsService,
  Subspace
} from './service';
import { Cleaner } from 'visual-insights';
import { DataSource, Record, BIField, Field, OperatorType } from './global';
import { Specification } from './demo/vegaBase';
import Gallery from './pages/gallery/index';
import NoteBook from './pages/notebook/index';
const pivotList = [
  {
    title: 'DataSource',
    itemKey: 'pivot-' + 1
  },
  {
    title: 'NoteBook',
    itemKey: 'pivot-' + 2
  },
  {
    title: 'Explore',
    itemKey: 'pivot-' + 3
  }
]

interface PageStatus {
  show: {
    insightBoard: boolean;
    configPanel: boolean;
    fieldConfig: boolean;
    dataConfig: boolean;
  },
  current: {
    pivotKey: string;
  }
}
// todo
// cleanMethodList has redundency.
// clean method type, cleanData(switch), cleanMethodList should be maintained in one structure.
type CleanMethod = 'dropNull' | 'useMode' | 'simpleClean';

function cleanData (dataSource: DataSource, dimensions: string[], measures: string[], method: CleanMethod): DataSource {
  // hint: dropNull works really bad when we test titanic dataset.
  // useMode fails when there are more null values than normal values;
  switch (method) {
    case 'dropNull':
      return Cleaner.dropNull(dataSource, dimensions, measures);
    case 'useMode':
      // todo: bad props design
      return Cleaner.useMode(dataSource, dimensions.concat(measures));  
    case 'simpleClean':
    default:
      return Cleaner.simpleClean(dataSource, dimensions, measures);
  }
}

const cleanMethodList: Array<{ key: CleanMethod; text: string }> = [
  { key: 'dropNull', text: 'drop null records' },
  { key: 'useMode', text: 'replace null with mode' },
  { key: 'simpleClean', text: 'simple cleaning' }
]



function App() {
  const [state, updateState] = useGlobalState();
  const [pageStatus, setPageStatus] = useComposeState<PageStatus>({
    show: {
      insightBoard: false,
      fieldConfig: false,
      configPanel: false,
      dataConfig: false
    },
    current: {
      pivotKey: pivotList[0].itemKey
    }
  })

  const [summaryData, setSummaryData] = useState<{
    originSummary: FieldSummary[],
    groupedSummary: FieldSummary[]
  }>({ groupedSummary: [], originSummary: []});
  const [cleanMethod, setCleanMethod] = useState<CleanMethod>('dropNull');

  const dataSetting = useRef<HTMLDivElement>(null);
  const fileEle = useRef<HTMLInputElement>(null);

  const dataSource = useMemo<DataSource>(() => {
    return state.rawData.map(row => {
      let record: Record = {}
      state.fields.forEach(field => {
        record[field.name] = field.type === 'dimension' ? row[field.name] : transNumber(row[field.name])
      })
      return record
    })
  }, [state.fields, state.rawData])


  async function univariateSummary (dataSource: DataSource, fields: BIField[]) {
    const dimensions = fields.filter(field => field.type === 'dimension').map(field => field.name)
    const measures = fields.filter(field => field.type === 'measure').map(field => field.name)
    // updateState(draft => { draft.loading.univariateSummary = true })
    try {
      /**
       * get summary of the orignal dataset(fields without grouped)
       */
      const originSummary = await getFieldsSummaryService(dataSource, fields.map(f => f.name));
      // todo only group dimension.
      let fieldWithTypeList: Field[] = originSummary ? originSummary
        .filter(f => dimensions.includes(f.fieldName))
        .map(f => {
          return {
            name: f.fieldName,
            type: f.type
          }
        }) : [];
      /**
       * bug:
       * should not group measures!!!
       */
      const groupedResult = await getGroupFieldsService(dataSource, fieldWithTypeList);
      const { groupedData, newFields } = groupedResult ? groupedResult : { groupedData: dataSource, newFields: fieldWithTypeList };
      /**
       * `newBIFields` shares the same length (size) with fields.
       * It repalces some of the fields with high entropy with a grouped new field.
       * newBIFields does not contain field before grouped.
       */
      const newBIFields: BIField[] = fields.map(field => {
        let groupedField = newFields.find(f => f.name === field.name + '(group)')
        return {
          name: groupedField ? groupedField.name : field.name,
          type: field.type
        }
      })
      const newDimensions: string[] = newBIFields.filter(f => f.type === 'dimension').map(f => f.name);
      // updateState(draft => {
      //   draft.cookedDimensions = newDimensions;
      //   draft.cookedMeasures = measures;
      // })
      /**
       * groupedSummary only contains newFields generated during `groupFieldsService`.
       */
      const groupedSummary = await getFieldsSummaryService(groupedData, newFields);
      // console.error('groupedData', groupedData)
      updateState(draft => { draft.cookedDataSource = groupedData })
      setSummaryData({
        originSummary: originSummary || [],
        groupedSummary: groupedSummary || []
      })
      // setFields(newBIFields);
      // tmp solutions
      let summary = (groupedSummary || []).concat(originSummary || []);
      
      updateState(draft => { draft.loading.univariateSummary = false })
      await SubspaceSeach(groupedData, summary, newDimensions, measures, 'sum');
    } catch (error) {
      updateState(draft => { draft.loading.univariateSummary = false })
    }
  }

  async function SubspaceSeach (dataSource: DataSource, summary: FieldSummary[], dimensions: string[], measures: string[], operator: OperatorType) {
    updateState(draft => { draft.loading.subspaceSearching = true })
    let orderedDimensions: Array<{name: string; entropy: number}> = [];
    orderedDimensions = dimensions.map(d => {
      let target = summary.find(g => g.fieldName === d)
      return {
        name: d,
        entropy: target ? target.entropy : Infinity
      }
    })
    
    orderedDimensions.sort((a, b) => a.entropy - b.entropy);
    updateState(draft => {
      draft.cookedDimensions = orderedDimensions.map(d => d.name);
      draft.cookedMeasures = measures;
    })
    const selectedDimensions = orderedDimensions.map(d => d.name).slice(0, Math.round(orderedDimensions.length * state.topK.dimensionSize));
    try {
      const subspaceList = await combineFieldsService(dataSource, selectedDimensions, measures, operator);
      if (subspaceList) {
        updateState(draft => {
          draft.subspaceList = subspaceList
        })
      }
      updateState(draft => { draft.loading.subspaceSearching = false })
    } catch (error) {
      updateState(draft => { draft.loading.subspaceSearching = false })
    }
  }


  // ChevronRight
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
      } else if (file.type === 'application/json') {
        rawData = await FileLoader.jsonLoader(file);
      }
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
  function transNumber(num: any): number | null {
    if (isNaN(num)) {
      return null
    }
    return Number(num)
  }
  // console.log(cleanMethod)
  const preparedData = useMemo<DataSource>(() => {
    const dimensions = state.fields.filter(field => field.type === 'dimension').map(field => field.name)
    const measures = state.fields.filter(field => field.type === 'measure').map(field => field.name)
    return cleanData(deepcopy(dataSource), dimensions, measures, cleanMethod);
  }, [state.fields, dataSource, cleanMethod])
  // console.log(preparedData, state.cookedDataSource);
  return (
    <div>
      <div className="header-bar" >
        <div className="ms-Grid-row">
          <div className="ms-Grid-col ms-sm6 ms-md4 ms-lg1">
            <a href="https://github.com/ObservedObserver/visual-insights" className="logo">
              <img src="/logo.png" />
            </a>
          </div>
          <div className="ms-Grid-col ms-sm6 ms-md8 ms-lg11">
            <Pivot selectedKey={pageStatus.current.pivotKey} onLinkClick={(item) => { item && item.props.itemKey && setPageStatus(draft => { draft.current.pivotKey = item.props.itemKey! }) }} headersOnly={true}>
              {
                pivotList.map(pivot => <PivotItem key={pivot.itemKey} headerText={pivot.title} itemKey={pivot.itemKey} />)
              }
            </Pivot>
          </div>
        </div>
      </div>
      {
        pageStatus.current.pivotKey === 'pivot-3' && <Gallery subspaceList={state.subspaceList} dataSource={state.cookedDataSource} summaryData={summaryData}  />
      }
      {
        pageStatus.current.pivotKey === 'pivot-1' && <div className="content-container">
          <FieldPanel fields={state.fields}
          show={pageStatus.show.fieldConfig} onUpdateConfig={(fields) => {
              updateState(draft => { draft.fields = fields })
            }}
            onClose={() => { setPageStatus(draft => { draft.show.fieldConfig = false }) }}
          />
          <div className="card">
            <Stack horizontal>
              <DefaultButton disabled={dataSource.length === 0} iconProps={{iconName: 'Financial'}} text="Extract Insights" onClick={() => {
                univariateSummary(preparedData, state.fields);
                setPageStatus(draft => {
                  draft.current.pivotKey = 'pivot-3';
                  draft.show.insightBoard = true
                })
                // extractInsights(dataSource, fields);
              }} />
              <div ref={dataSetting}>
                <IconButton iconProps={{iconName: 'ExcelDocument'}} ariaLabel="upload data" onClick={() => { setPageStatus(draft => { draft.show.dataConfig = true }) }} />
                <Callout
                  style={{ maxWidth: 300}}
                  className="vi-callout-callout"
                  role="alertdialog"
                  gapSpace={0}
                  target={dataSetting.current}
                  onDismiss={() => { setPageStatus(draft => { draft.show.dataConfig = false }) }}
                  setInitialFocus={true}
                  hidden={!pageStatus.show.dataConfig}
                >
                  <div className="vi-callout-header">
                  <p className="vi-callout-title">
                    Upload Your own dataset
                  </p>
                </div>
                <div className="vi-callout-inner">
                  <div className="vi-callout-content">
                    <p className="vi-callout-subTex">
                      .csv, .json, .txt are supportted.
                    </p>
                  </div>
                  <div className="vi-callout-actions">
                    <input type="file" ref={fileEle} multiple accept="*" style={{ display: 'none' }} onChange={fileUploadHanlder} />
                    <CommandBar overflowButtonProps={{ name: 'More' }} items={commandBarList} />
                  </div>
                </div>
              </Callout>
              </div>
              <IconButton iconProps={{iconName: 'Settings'}} ariaLabel="field setting" onClick={() => { setPageStatus(draft => { draft.show.fieldConfig = true })}} />
              
            </Stack>
            <div style={{ margin: '20px 0px'}}>
              <ComboBox
                styles={{ root: { maxWidth: '180px'}}}
                selectedKey={cleanMethod}
                label="Clean Method"
                allowFreeform={true}
                autoComplete="on"
                options={cleanMethodList}
                onChange={(e, option) => {option && setCleanMethod(option.key as CleanMethod)}}
              />
            </div>
            <p style={{fontSize: 12, fontWeight: 400, color: '#595959'}}>
              Remember to adjust the fields' types and cleaning strategy before extracting insights.
            </p>
            <i style={{fontSize: 12, fontWeight: 300, color: '#595959'}}>Number of records {preparedData.length}</i>
            <DataTable
              fields={state.fields}
              dataSource={preparedData} />
          </div>
        </div>
      }
      {
        pageStatus.current.pivotKey === 'pivot-2' && <div className="content-container">
          <div className="card">
            <NoteBook summaryData={summaryData} subspaceList={state.subspaceList} dataSource={state.cookedDataSource} />
          </div>
        </div>
      }
      
    </div>
  );
}

export default function () {
  return <GlobalStateProvider>
    <App />
  </GlobalStateProvider>
};
