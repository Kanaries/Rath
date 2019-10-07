import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGlobalState, GlobalStateProvider } from './state';
import { DefaultButton, IconButton, Callout, Stack, ProgressIndicator, Pivot, PivotItem, CommandBar, Toggle, setFocusVisibility } from 'office-ui-fabric-react';
import DataTable from './components/table';
import PreferencePanel, { PreferencePanelConfig } from './components/preference';
import FieldPanel from './components/fieldConfig';
import BaseChart from './demo/vegaBase';
import { FileLoader, useComposeState } from './utils/index';
import './App.css';
import {
  fieldsAnalysisService,
  getInsightViewsService, View,
  getFieldsSummaryService, FieldSummary,
  getGroupFieldsService,
  combineFieldsService,
  Subspace
} from './service';
import { specificationWithFieldsAnalysisResult, Cleaner } from 'visual-insights';
import { DataSource, Record, BIField, Field, OperatorType } from './global';
import { Specification } from './demo/vegaBase';
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
interface DataView {
  schema: Specification,
  aggData: DataSource,
  fieldFeatures: Field[],
  dimensions: string[],
  measures: string[]
}

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
  const [loading, setLoading] = useState(false);

  const [visualConfig, setVisualConfig] = useState<PreferencePanelConfig>({
    aggregator: 'sum',
    defaultAggregated: true,
    defaultStack: true
  })
  const [cleanData, setCleanData] = useState<DataSource>([]);
  const [dimScores, setDimScores] = useState<Array<[string, number, number, Field]>>([]);
  const [dataView, setDataView] = useState<DataView>({
    schema: {
      position: [],
      color: [],
      opacity: [],
      geomType: []
    },
    fieldFeatures: [],
    aggData: [],
    dimensions: [],
    measures: []
  });
  const [summaryData, setSummaryData] = useState<{
    originSummary: FieldSummary[],
    groupedSummary: FieldSummary[]
  }>({ groupedSummary: [], originSummary: []});
  const [subspaceList, SetSubspaceList] = useState<Subspace[]>([])
  const [result, setResult] = useState<View[]>([]);

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

  async function extractInsights (dataSource: DataSource, fields: BIField[]) {
    const dimensions = fields.filter(field => field.type === 'dimension').map(field => field.name)
    const measures = fields.filter(field => field.type === 'measure').map(field => field.name)
    const cleanData = Cleaner.dropNull(dataSource, dimensions, measures);
    setLoading(true);
    try {
      const { dimScores, aggData, newDimensions } = await fieldsAnalysisService(cleanData, dimensions, measures);
      setCleanData(aggData);
      setDimScores(dimScores);
      const views = await getInsightViewsService(aggData, newDimensions, measures);
      setResult(views)
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  async function univariateSummary (dataSource: DataSource, fields: BIField[]) {
    try {
      /**
       * get summary of the orignal dataset(fields without grouped)
       */
      const originSummary = await getFieldsSummaryService(dataSource, fields.map(f => f.name));
      // todo only group dimension.
      let fieldWithTypeList: Field[] = originSummary ? originSummary.map(f => {
        return {
          name: f.fieldName,
          type: f.type
        }
      }) : [];
      const groupedResult = await getGroupFieldsService(dataSource, fieldWithTypeList);
      const { groupedData, newFields } = groupedResult ? groupedResult : { groupedData: dataSource, newFields: fieldWithTypeList };
      /**
       * `newBIFields` shares the same length (size) with fields.
       * It repalces some of the fields with high entropy with a grouped new field.
       */
      const newBIFields: BIField[] = fields.map(field => {
        let groupedField = newFields.find(f => f.name === field.name + '(group)')
        return {
          name: groupedField ? groupedField.name : field.name,
          type: field.type
        }
      })
      const newDimensions: string[] = newBIFields.filter(f => f.type === 'dimension').map(f => f.name);
      /**
       * groupedSummary only contains newFields generated during `groupFieldsService`.
       */
      const groupedSummary = await getFieldsSummaryService(groupedData, newFields);
      setSummaryData({
        originSummary: originSummary || [],
        groupedSummary: groupedSummary || []
      })
      // setFields(newBIFields);
      // tmp solutions
      let orderedDimensions = groupedSummary ? newDimensions.map(d => {
        let target = groupedSummary.find(g => g.fieldName === d)
        return {
          name: d,
          entropy: target ? target.entropy : Infinity
        }
      }) : [];
      orderedDimensions.sort((a, b) => a.entropy - b.entropy);
      const measures = fields.filter(field => field.type === 'measure').map(field => field.name)
      await SubspaceSeach(groupedData, orderedDimensions.map(d => d.name).slice(0, Math.round(orderedDimensions.length * 0.8)), measures, 'sum');
    } catch (error) {
      
    }
  }

  async function SubspaceSeach (dataSource: DataSource, dimensions: string[], measures: string[], operator: OperatorType) {
    const subspaceList = await combineFieldsService(dataSource, dimensions, measures, operator);
    if (subspaceList) {
      SetSubspaceList(subspaceList);
    }
  }

  useEffect(() => {
    if (charts.length > 0) {
      gotoPage(0)
    }
  }, [cleanData, result]);

  const charts = useMemo<Array<{ dimList: string[]; meaList: string[] }> >(() => {
    let ans = [];
    for (let report of result) {
      const dimList = report.detail[0];
      for (let meaList of report.groups) {
        ans.push({
          dimList,
          meaList
        })
      }
    }
    return ans;
  }, [result])
  
  const gotoPage = (pageNo: number) => {
    // let pageNo = (page - 1 + charts.length) % charts.length;
    let fieldsOfView = charts[pageNo].dimList.concat(charts[pageNo].meaList)
    let scoreOfDimensionSubset = dimScores.filter(dim => fieldsOfView.includes(dim[0]));
    let {schema, aggData} = specificationWithFieldsAnalysisResult(scoreOfDimensionSubset, cleanData, charts[pageNo].meaList);
    updateState(draft => draft.currentPage = pageNo)
    setDataView({
      schema,
      aggData,
      fieldFeatures: scoreOfDimensionSubset.map(item => item[3]),
      dimensions: charts[pageNo].dimList,
      measures: charts[pageNo].meaList
    })
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
  
  return (
    <div>
      <div className="header-bar" >
        <Pivot selectedKey={pageStatus.current.pivotKey} onLinkClick={(item) => { item && item.props.itemKey && setPageStatus(draft => draft.current.pivotKey = item.props.itemKey!) }} headersOnly={true}>
          {
            pivotList.map(pivot => <PivotItem key={pivot.itemKey} headerText={pivot.title} itemKey={pivot.itemKey} />)
          }
        </Pivot>
      </div>
      {
        pageStatus.current.pivotKey === 'pivot-3' && <div className="content-container">
          <PreferencePanel show={pageStatus.show.configPanel}
            config={visualConfig}
            onUpdateConfig={(config) => {
              setVisualConfig(config)
              setPageStatus(draft => draft.show.configPanel = false)
            }}
            onClose={() => { setPageStatus(draft => draft.show.configPanel = false) }} />
          {
            !pageStatus.show.insightBoard ? undefined : <div className="card">
              {
                !loading ? undefined : <ProgressIndicator description="calculating" />
              }
              <h2 style={{marginBottom: 0}}>Visual Insights <IconButton iconProps={{iconName: 'Settings'}} ariaLabel="preference" onClick={() => { setPageStatus(draft => draft.show.configPanel = false) }} /></h2>
              <p className="state-description">Page No. {state.currentPage + 1} of {charts.length}</p>
              <div className="ms-Grid" dir="ltr">
                <div className="ms-Grid-row">
                <div className="ms-Grid-col ms-sm6 ms-md8 ms-lg3" style={{overflow: 'auto'}}>
                  <Stack horizontal tokens={{ childrenGap: 20 }}>
                    <DefaultButton text="Last" onClick={() => { gotoPage((state.currentPage - 1 + charts.length) % charts.length) }} allowDisabledFocus />
                    <DefaultButton text="Next" onClick={() => { gotoPage((state.currentPage + 1) % charts.length) }} allowDisabledFocus />
                  </Stack>
                  <h3>Specification</h3>
                  <pre>
                    {JSON.stringify(dataView.schema, null, 2)}
                  </pre>
                </div>
                <div className="ms-Grid-col ms-sm6 ms-md4 ms-lg9" style={{overflow: 'auto'}}>
                  <BaseChart
                    aggregator={visualConfig.aggregator}
                    defaultAggregated={visualConfig.defaultAggregated}
                    defaultStack={visualConfig.defaultStack}
                    dimensions={dataView.dimensions}
                    measures={dataView.measures}
                    dataSource={dataView.aggData}
                    schema={dataView.schema}
                    fieldFeatures={dataView.fieldFeatures} />
                </div>
                </div>
              </div>
            </div>
          }
        </div>
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
                const dimensions = state.fields.filter(field => field.type === 'dimension').map(field => field.name)
                const measures = state.fields.filter(field => field.type === 'measure').map(field => field.name)
                const cleanData = Cleaner.dropNull(dataSource, dimensions, measures);
                univariateSummary(cleanData, state.fields);
                setPageStatus(draft => {
                  draft.current.pivotKey = 'pivot-2';
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
            <DataTable
              fields={state.fields}
              dataSource={dataSource} />
          </div>
        </div>
      }
      {
        pageStatus.current.pivotKey === 'pivot-2' && <div className="content-container">
          <div className="card">
            <NoteBook dimScores={dimScores} summaryData={summaryData} subspaceList={subspaceList} />
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
