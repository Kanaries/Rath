import React, { useState, useEffect } from 'react';
import Demo from './demo/g2';
// import { specification } from './build/bundle.js';
// import dataset from './build/airbnb.json';
import './App.css';

const { getInsightViews, specification, dropNull } = require('./build/bundle.js');

function App() {
  const [page, setPage] = useState(0);
  const [dataset, setDataset] = useState({
    dataSource: [],
    config: {
      Dimensions: [],
      Measures: []
    }
  })
  useEffect(() => {
    fetch('http://localhost:8000/api/airbnb')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setDataset(res.data)
        }
      })
  }, [])
  const {
    dataSource,
    config: {
      Dimensions: dimensions,
      Measures: measures
    }
  } = dataset;
  const cleanData = dropNull(dataSource, dimensions, measures);
  let result = getInsightViews(cleanData, dimensions, measures);
    // console.log(result)
  let charts = [];
  for (let report of result) {
    const dimList = report.detail[0];
    for (let meaList of report.groups) {
      const { schema, aggData } = specification(cleanData, dimList, meaList);
      charts.push({ schema, aggData })
    }
  }
  return (
    <div>
      <p>page no. {page} of {charts.length}</p>
      <div>
        <div onClick={() => { setPage((page - 1 + charts.length) % charts.length)}}
          className="button">Last</div>
        <div onClick={() => { setPage((page + 1) % charts.length)}}
          className="button">Next</div>
      </div>
      {
        charts.length === 0 ? '' : <div>
          <p>
            {JSON.stringify(charts[page].schema)}
          </p>
          <Demo dataSource={charts[page].aggData} schema={charts[page].schema} />
        </div>
      }
    </div>
  );
}

export default App;
