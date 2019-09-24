const fs = require('fs');
const assert = require('assert');
const path  = require('path');

const { analysisDimensions, dropNull, getInsightViews, getCombination } = require('../lib/build/bundle');

const datasetPath = path.resolve(__dirname, './dataset/airbnb.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath).toString());
const {
  dataSource,
  config: {
    Dimensions: dimensions,
    Measures: measures
  }
} = dataset;
let cleanData = dropNull(dataSource, dimensions, measures);

describe('insights test', function () {
  // it('print(analysisDimensions)', function () {
  //   const result = analysisDimensions(cleanData, dimensions, measures);
  //   console.table(result.map(r => {
  //     return [r[0][0], JSON.stringify(r[1]), JSON.stringify(r[2])];
  //   }))
  //   assert.equal(result.length, dimensions.length);
  // })

  // it('print(getInsightViews)', function () {
  //   let result = getInsightViews(cleanData, dimensions, measures);
  //   // console.log(result)
  //   assert.equal(result.length > 0, true);
  // })
  
  it('print(getCombination)', function () {
    let result = getCombination([1, 2, 3, 4, 5, 6]);
    console.log(result)
    assert.equal(result.length, Math.pow(2, 6) - 1)
  })
})

