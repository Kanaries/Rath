const assert = require('assert');
const { normalize, gini, entropy } = require('../lib/build/bundle');

describe('Impurity Measure test', function () {
  describe('function: normalize', function () {
    it('sum_{p} = 1', function () {
      const size = 2 + Math.round(Math.random() * 100);
      let frequencyList = [];
      for (let i = 0; i < size; i++) {
        frequencyList.push(Math.round(Math.random() * 1000));
      }
      const probabilityList = normalize(frequencyList);

      let sum = 0;
      for (let p of probabilityList) {
        sum += p;
      }
      assert.equal(Math.abs(1 - sum) < Number.EPSILON * Math.pow(2, 2) * probabilityList.length, true);
      // assert.equal(Math.abs(1 - sum) < 0.001, true);
    })
  })

  describe('function: entropy', function () {
    it('value <=log(k)', function () {
        const size = 2 + Math.round(Math.random() * 100);
        let frequencyList = [];
        for (let i = 0; i < size; i++) {
          frequencyList.push(Math.round(Math.random() * 1000));
        }
        const probabilityList = normalize(frequencyList);

        let ans = entropy(probabilityList);

        assert.equal(Math.log2(size) >= ans, true);
      })
  })

  describe('function: gini', function () {
    it('value <= 1', function () {
        const size = 2 + Math.round(Math.random() * 100);
        let frequencyList = [];
        for (let i = 0; i < size; i++) {
          frequencyList.push(Math.round(Math.random() * 1000));
        }
        const probabilityList = normalize(frequencyList);

        let ans = gini(probabilityList);

        assert.equal(ans <= 1, true);
      })
  })
})