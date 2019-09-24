import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Demo from './demo/g2';
// import { specification } from './build/bundle.js';
// import dataset from './build/airbnb.json';
import './App.css';

const { getInsightViews, specification, dropNull, fieldsAnalysis } = require('./build/bundle.js');

function App() {
  const [page, setPage] = useState(0);
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
  useEffect(() => {
    fetch('http://localhost:8000/api/titanic')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setDataset(res.data);
        }
      })
  }, [])
  useEffect(() => {
    const {
      dataSource,
      config: {
        Dimensions: dimensions,
        Measures: measures
      }
    } = dataset;
    const cleanData = dropNull(dataSource, dimensions, measures);
    const { dimScores, aggData, mapData, newDimensions } = fieldsAnalysis(cleanData, dimensions, measures)
    console.log(aggData, dimensions ,newDimensions)
    setCleanData(aggData);
    setResult(getInsightViews(aggData, newDimensions, measures))
  }, [dataset])
    // console.log(result)
  let charts = [];
  for (let report of result) {
    const dimList = report.detail[0];
    for (let meaList of report.groups) {
      // const { schema, aggData } = specification(cleanData, dimList, meaList);
      // charts.push({ schema, aggData })
      charts.push({
        dimList,
        meaList
      })
    }
  }
  return (
    <div>
      <p>page no. {page} of {charts.length}</p>
      <div>
        <div onClick={() => {
          let newPage = (page - 1 + charts.length) % charts.length;
          let {schema, aggData} = specification(cleanData, charts[newPage].dimList, charts[newPage].meaList);
          setPage(newPage);
          setDataView({
            schema,
            aggData
          })
        }}
          className="button">Last</div>
        <div onClick={() => {
          let newPage = (page + 1) % charts.length;
          let {schema, aggData} = specification(cleanData, charts[newPage].dimList, charts[newPage].meaList);
          setDataView({
            schema,
            aggData
          })
          setPage(newPage)
          console.log('======')
          console.log(charts[newPage])
          console.log({
            schema,
            aggData
          })
        }}
          className="button">Next</div>
          <div>
            <ReactMarkdown source={`\`\`\`json\n${JSON.stringify(dataView.schema)}\n\`\`\``} />
          </div>
      </div>
      {
        charts.length === 0 ? '' : <div>
          <Demo dimensions={charts[page].dimList} measures={charts[page].meaList} dataSource={dataView.aggData} schema={dataView.schema} />
        </div>
      }
    </div>
  );
}

export default App;
