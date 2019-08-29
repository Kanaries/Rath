const assert = require('assert');
const fs = require('fs');
const { specification, visualElements } = require('../lib/build/bundle');
const path = require('path');

const datasetPath = path.resolve(__dirname, './dataset/titanic.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath).toString());
const {
  dataSource,
  config: {
    Measures: measures
  }
} = dataset;

const dimensions = ['Age', 'Survived', 'Parch', 'Sex', 'Embarked', 'Pclass'];

describe('specification test', function () {
  it('specification result', function () {
    const { schema, aggData } = specification(dataSource, dimensions, measures);
    console.log(schema);
    assert.equal(Object.keys(schema).length > 0, true);
    for (let [element, size] of visualElements) {
      if (typeof schema[element] !== 'undefined') {
        assert.equal(schema[element].length <= size, true);
      }
    }
  })
})