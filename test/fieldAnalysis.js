const fs = require('fs');
const assert = require('assert');
const path  = require('path');

const { fieldsAnalysis } = require('../lib/build/bundle');

const datasetPath = path.resolve(__dirname, './dataset/titanic.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath).toString());
const {
  dataSource,
  config: {
    Dimensions: dimensions,
    Measures: measures
  }
} = dataset;

describe('test with titanic dataset', function () {
  it('[print result]', function () {
    const result = fieldsAnalysis(dataSource, dimensions, measures);
    console.table(result)
    assert.equal(result.length, dimensions.length);
  })
})

