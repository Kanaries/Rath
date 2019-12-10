const fs = require('fs');
const assert = require('assert');
const path  = require('path');

const { analysisDimensions, Cleaner, getInsightViews, getCombination, DashBoard } = require('../build/cjs/index');

const datasetPath = path.resolve(__dirname, './dataset/titanic.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath).toString());
const {
  dataSource,
  config: {
    Dimensions: dimensions,
    Measures: measures
  }
} = dataset;
let cleanData = Cleaner.dropNull(dataSource, dimensions, measures);

describe('insights test', function () {
  it('print(dashboard)', function () {
    const fieldFeastureList = analysisDimensions(cleanData, dimensions, measures);
    // assert.equal(fieldFeastureList.length, dimensions.length);
    const dashboardSpace = DashBoard.getDashBoardSubspace(cleanData, dimensions, measures, fieldFeastureList);
    console.log(JSON.stringify(dashboardSpace, null, 2))
    assert.equal(dashboardSpace.length > 0, true);
    const sampleViewList = DashBoard.getDashBoardView(dashboardSpace[0], dataSource);
    assert.equal(sampleViewList.length > 0, true);
    console.log(sampleViewList)
  })

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

