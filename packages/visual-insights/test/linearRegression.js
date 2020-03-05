const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { Statistics } = require('../build/cjs/index');
const datasetPath = path.resolve(__dirname, './dataset/linear.json');
const data = JSON.parse(fs.readFileSync(datasetPath).toString());
function floatEqual(num1, num2) {
  return Math.abs(num1 - num2) <= 0.0001;
}
describe('linear regression', function () {
  describe('case1 test', function () {
    const linearModel = new Statistics.oneDLinearRegression(data, 'x', 'y');
    it('init', function () {
      assert.equal(linearModel.dataSource.length > 0, true);
    })
    it('mean', function () {
      let [meanX, meanY] = linearModel.mean();
      assert.equal(floatEqual(meanX, 56.241206), true);
      assert.equal(floatEqual(meanY, 359.670827), true)
    })
    it('regression', function () {
      let [alpha, beta] = linearModel.getRegressionEquation();
      console.log(alpha, beta)
      assert.equal(floatEqual(beta, 3.974418353), true)
    })
    it('r_squared', function () {
      let r_squared = linearModel.r_squared();
      assert.equal(floatEqual(r_squared, 0.982668168), true)
    })
    it('p-value', function () {
      let p = linearModel.pValue();
      assert.equal(p < 1, true)
    })
  })
})