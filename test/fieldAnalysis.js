const fs = require('fs');
const assert = require('assert');
const path  = require('path');

const { fieldsAnalysis } = require('../lib/build/bundle');

const datasetPath = path.resolve(__dirname, './dataset/titanic.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath).toString());
const {
  dataSource,
  config: {
    Measures: measures
  }
} = dataset;
const dimensions = ['Age', 'Survived', 'Parch', 'Sex', 'Embarked', 'Pclass'];

describe('test with titanic dataset', function () {
  it('[print result]', function () {
    const { dimScores: result } = fieldsAnalysis(dataSource, dimensions, measures);
    console.table(result)
    assert.equal(result.length, dimensions.length + measures.length);
  })
})

