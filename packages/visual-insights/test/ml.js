const fs = require('fs');
const assert = require('assert');
const path  = require('path');

const { Outier, Cleaner, Classification } = require('../build/cjs/index');

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
      it('random data test', function () {
        let dataSource = [];
        let total = 0;
        while (total <= 4000) {
          let x = -1 + Math.random() * 2;
          let y = -1 + Math.random() * 2;
          let z = -1 + Math.random() * 2;
          let poss = Math.random();
          if (poss > Math.sqrt(x ** 2 + y ** 2 + z ** 2) / Math.sqrt(3)) {
            dataSource.push({
              x, y, z
            });
            total++;
          }
        }
        let iForest = new Outier.IsolationForest([], ['x', 'y', 'z'], dataSource);
        iForest.buildIsolationForest();
        let scoreList = iForest.estimateOutierScore();
        assert.equal(iForest.treeNumber, 100);
        assert.equal(iForest.sampleSize, 256);
        let dataScore = dataSource.map((record, index) => {
          return {
            ...record,
            score: scoreList[index]
          }
        })
        dataScore.sort((a, b) => b.score - a.score);
        assert.equal(scoreList.length, dataSource.length);
        dataScore.slice(0, 40).forEach(record => {
          assert.equal(record.x ** 2 + record.y ** 2 + record.z ** 2 > 1, true)
        })
      })
      it('titanic', function () {
        let iForest = new Outier.IsolationForest(['Sex', 'Pclass', 'Age', 'Parch'], ['Survived'], cleanData);
        assert.equal(iForest.treeNumber < 100, true);
        assert.equal(iForest.sampleSize < 256, true);
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
        console.log(max, maxPos, cleanData[maxPos])
        assert.equal(scoreList.length, cleanData.length);
      })
    })
  })
  describe('classification', function () {
    describe('KNN', function () {
      it('titanic', function () {
        let knn = new Classification.KNN({
          dataSource,
          dimensions,
          measures,
          K: 5
        })
        let sample = dataSource[0];
        let neighbors = knn.getNeighbors(sample, ['Sex', 'Pclass', 'Age', 'Parch']);
        // let predict = knn.getTargetValue(['Survived'], neighbors);
        // console.log(sample, predict)
        assert.equal(neighbors.length, 5);
      })
    })
  })
})