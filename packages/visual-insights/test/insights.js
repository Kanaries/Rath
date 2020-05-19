const fs = require('fs');
const assert = require('assert');
const path  = require('path');

const { Insight, Cleaner, Statistics, Sampling, Utils } = require('../build/cjs/index');
const { getVisSpaces } = require('../build/cjs/insights/dev');
const datasetPath = path.resolve(__dirname, './dataset/airbnb.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath).toString());
const {
  dataSource,
  config: {
    Dimensions: dimensions,
    Measures: measures
  }
} = dataset;
let cleanData = Sampling.reservoirSampling(Cleaner.dropNull(dataSource, dimensions, measures), 2000);

describe('insights test', function () {
  it('print(analysisDimensions)', function () {
    const result = Insight.insightExtraction(cleanData, dimensions, measures);
    assert.equal(result.length > 0, true);
  })

  it('print(dev pipeline)', async function () {
    const collection = Insight.IntentionWorkerCollection.init();
    collection.enable(Insight.DefaultIWorker.cluster, false);
    const result = await getVisSpaces({
      dataSource: cleanData,
      dimensions: dimensions.filter(dim => !Utils.isFieldUnique(cleanData, dim)),
      measures,
      collection
    });
    assert.equal(result.length > 0, true);
  })
  
  it('print(getCombination)', function () {
    let result = Statistics.getCombination([1, 2, 3, 4, 5, 6]);
    assert.equal(result.length, Math.pow(2, 6) - 1)
  })

  it('print(clusterCombination vs. combination)', function () {
    let result = Insight.subspaceSearching(cleanData, dimensions, true);
    let unClusterResult = Statistics.getCombination(dimensions);
    console.log(result.length, unClusterResult.length)
    assert.equal(result.length <= unClusterResult.length, true);
  })
})

