import React, { useState, useEffect } from 'react';
import { DefaultButton, PrimaryButton, Stack, ProgressIndicator, FrontIcon } from 'office-ui-fabric-react';
import DataTable from './components/table';

import BaseChart from './demo/vegaBase';
import './App.css';

const { specification, dropNull } = require('./build/bundle.js');

function App() {
  const [page, setPage] = useState(0);
  const [showInsightBoard, setShowInsightBoard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState({
    dataSource: [],
    config: {
      Dimensions: [],
      Measures: []
    }
  })
  const [cleanData, setCleanData] = useState([]);
  const [dataView, setDataView] = useState({
    schema: {
      position: [],
      color: [],
      opacity: [],
      geomType: ['interval']
    },
    aggData: []
  });
  const [result, setResult] = useState([]);
  async function fetchDataSource () {
    const res = await fetch('//localhost:8000/api/data/airbnb');
    const result = await res.json();
    if (result.success) {
      setDataset(result.data);
    }
  }
  async function fieldsAnalysisService (cleanData, dimensions, measures) {
    const res = await fetch('//localhost:8000/api/service/fieldsAnalysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataSource: cleanData,
        dimensions,
        measures
      })
    });
    const result = await res.json();
    if (result.success) {
      const { dimScores, aggData, mapData, newDimensions } = result.data;
      setCleanData(aggData);
      await getInsightViewsService(aggData, newDimensions, measures);
    }
  }
  async function getInsightViewsService (aggData, newDimensions, measures) {
    const res = await fetch('//localhost:8000/api/service/getInsightViews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataSource: aggData,
        dimensions: newDimensions,
        measures
      })
    });
    const result = await res.json();
    if (result.success) {
      const views = result.data;
      setResult(views);
    }
  }
  async function extractInsights (dataset) {
    const {
      dataSource,
      config: {
        Dimensions: dimensions,
        Measures: measures
      }
    } = dataset;
    const cleanData = dropNull(dataSource, dimensions, measures);
    setLoading(true);
    await fieldsAnalysisService(cleanData, dimensions, measures);
    setLoading(false);
  } 
  useEffect(() => {
    fetchDataSource();
  }, [])

  useEffect(() => {
    if (charts.length > 0) {
      setPage(0)
      let {schema, aggData} = specification(cleanData, charts[page].dimList, charts[page].meaList);
      setDataView({
        schema,
        aggData
      })
    }
  }, [cleanData, result]);


  let charts = [];
  for (let report of result) {
    const dimList = report.detail[0];
    for (let meaList of report.groups) {
      charts.push({
        dimList,
        meaList
      })
    }
  }
  const gotoPage = (pageNo) => {
    // let pageNo = (page - 1 + charts.length) % charts.length;
    let {schema, aggData} = specification(cleanData, charts[pageNo].dimList, charts[pageNo].meaList);
    setPage(pageNo);
    setDataView({
      schema,
      aggData
    })
  }
  // ChevronRight
  return (
    <div>
      <div className="header-bar" ></div>
      <div className="content-container">
        {
          !showInsightBoard ? undefined : <div className="card">
            {
              !loading ? undefined : <ProgressIndicator label="Finding insights" description="calculating" />
            }
            <p>page no. {page + 1} of {charts.length}</p>
            <Stack horizontal tokens={{ childrenGap: 20}}>
              <DefaultButton text="Last" iconProps={{iconName: 'ChevronLeft'}} onClick={() => { gotoPage((page - 1 + charts.length) % charts.length) }} allowDisabledFocus />
              <DefaultButton text="Next" iconProps={{iconName: 'ChevronRight'}} onClick={() => { gotoPage((page + 1) % charts.length) }} allowDisabledFocus />
              <PrimaryButton text="intrested" />
            </Stack>
            <div className="ms-Grid" dir="ltr">
              <div className="ms-Grid-row">
              <div className="ms-Grid-col ms-sm6 ms-md8 ms-lg3">
                <h3>Specification</h3>
                <pre>
                  {JSON.stringify(dataView.schema, null, 2)}
                </pre>
              </div>
              <div className="ms-Grid-col ms-sm6 ms-md4 ms-lg9" style={{overflow: 'auto'}}>
                  <BaseChart dataSource={dataView.aggData} schema={dataView.schema} />
              </div>
              </div>
            </div>
          </div>
        }
        <div className="card">
          <PrimaryButton text="Extract Insights" onClick={() => {
              setShowInsightBoard(true);
              extractInsights(dataset);
            }} />
          <DataTable
            dimensions={dataset.config.Dimensions}
            measures={dataset.config.Measures}
            dataSource={dataset.dataSource} />
        </div>
      </div>
    </div>
  );
}

export default App;
