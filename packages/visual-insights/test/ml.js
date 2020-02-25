const fs = require('fs');
const assert = require('assert');
const path  = require('path');

const { Outier, Cleaner } = require('../build/cjs/index');

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

describe('machine learning algorithms', function () {
  describe('outlier detection', function () {
    describe('isolation forest', function () {
      it('titanic', function () {
        let iForest = new Outier.IsolationForest(['Sex', 'Pclass', 'Age', 'Parch'], ['Survived'], dataSource);
        iForest.buildIsolationForest();
        let scoreList = iForest.estimateOutierScore();
        let max = 0;
        let maxPos = 0;
        scoreList.forEach((score, index) => {
          if (score > max) {
            max = score;
            maxPos = index;
          }
          assert.equal(score <= 1, true)
        })
        console.log(max, maxPos, dataSource[maxPos])
        assert.equal(scoreList.length, dataSource.length);
      })
    })
  })
})