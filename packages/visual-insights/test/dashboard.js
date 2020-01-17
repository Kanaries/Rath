const fs = require('fs');
const assert = require('assert');
const path  = require('path');

const { Insight, Cleaner, Statistics, DashBoard } = require('../build/cjs/index');

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

describe('dashboard test', function () {
  it('print(dashboard)', function () {
    const fieldFeastureList = Insight.insightExtraction(cleanData, dimensions, measures);
    // assert.equal(fieldFeastureList.length, dimensions.length);
    const dashboardSpace = DashBoard.getDashBoardSubspace(cleanData, dimensions, measures, fieldFeastureList);
    console.log(JSON.stringify(dashboardSpace, null, 2))
    assert.equal(dashboardSpace.length > 0, true);
    const sampleViewList = DashBoard.getDashBoardView(dashboardSpace[0], dataSource);
    assert.equal(sampleViewList.length > 0, true);
    console.log(sampleViewList)
  })
  
  it('print(getCombination)', function () {
    let result = Statistics.getCombination([1, 2, 3, 4, 5, 6]);
    console.log(result)
    assert.equal(result.length, Math.pow(2, 6) - 1)
  })
  /**
   * test example
   * https://www.empirical-methods.hslu.ch/decisiontree/relationship/chi-square-contingency/
   */
  it('test crammerV', function () {
    let matrix = [
      [19, 32, 83, 97, 48],
      [2, 6, 16, 42, 26],
      [0, 1, 3, 21, 10]
    ]
    let data = []
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        for (let k = 0; k < matrix[i][j]; k++) {
          data.push({
            x: 'x' + i,
            y: 'y' + j
          })
        }
      }
    }
    let result = DashBoard.crammersV(data, 'x', 'y');
    assert.equal(result - 0.187 < 0.001, true);
  })
})

