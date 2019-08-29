import React from 'react';
import Demo from './demo/g2';
// import { specification } from './build/bundle.js';
import dataset from './build/titanic.json';

const { specification } = require('./build/bundle.js');

// import './App.css';

function App() {
  const {
    dataSource
  } = dataset;
  const dimensions = ['Age', 'Parch', 'Sex', 'Embarked', 'Pclass'];
  const measures = ['Count', 'Survived'];
  const { aggData, schema } = specification(dataSource, dimensions, measures);
  return (
    <div className="App">
      <Demo dataSource={aggData} schema={schema} />
    </div>
  );
}

export default App;
