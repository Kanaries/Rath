import React, { useState, useEffect } from 'react';
import { DefaultButton, PrimaryButton, Stack, ProgressIndicator, FrontIcon } from 'office-ui-fabric-react';
import DataTable from './components/table';

import BaseChart from './demo/vegaBase';
import './App.css';

const { specificationWithFieldsAnalysisResult, dropNull } = require('./build/bundle.js');

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
  const [dimScores, setDimScores] = useState([]);
  const [dataView, setDataView] = useState({
    schema: {
      position: [],
      color: [],
      opacity: [],
      geomType: ['interval']
    },
    fieldFeatures: [],
    aggData: [],
    dimensions: [],
    measures: []
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
      const { dimScores, aggData } = result.data;
      const newDimensions = dimScores.map(dim => dim[0]).filter(dim => !measures.includes(dim));
      setCleanData(aggData);
      setDimScores(dimScores);
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
      gotoPage(28)
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
    let fieldsOfView = charts[pageNo].dimList.concat(charts[pageNo].meaList)
    let scoreOfDimensionSubset = dimScores.filter(dim => fieldsOfView.includes(dim[0]));
    console.log(scoreOfDimensionSubset)
    let {schema, aggData} = specificationWithFieldsAnalysisResult(scoreOfDimensionSubset, cleanData, charts[pageNo].meaList);
    setPage(pageNo);
    setDataView({
      schema,
      aggData,
      fieldFeatures: scoreOfDimensionSubset.map(item => item[3]),
      dimensions: charts[pageNo].dimList,
      measures: charts[pageNo].meaList
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
            <p>Page No. {page + 1} of {charts.length}</p>
            <Stack horizontal tokens={{ childrenGap: 20}}>
              <DefaultButton text="Last" onClick={() => { gotoPage((page - 1 + charts.length) % charts.length) }} allowDisabledFocus />
              <DefaultButton text="Next" onClick={() => { gotoPage((page + 1) % charts.length) }} allowDisabledFocus />
              <PrimaryButton text="intrested" />
            </Stack>
            <div className="ms-Grid" dir="ltr">
              <div className="ms-Grid-row">
              <div className="ms-Grid-col ms-sm6 ms-md8 ms-lg3" style={{overflow: 'auto'}}>
                <h3>Specification</h3>
                <pre>
                  {JSON.stringify(dataView.schema, null, 2)}
                </pre>
              </div>
              <div className="ms-Grid-col ms-sm6 ms-md4 ms-lg9" style={{overflow: 'auto'}}>
                  <BaseChart
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
