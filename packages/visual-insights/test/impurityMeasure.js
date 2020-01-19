const assert = require('assert');
const { Statistics } = require('../build/cjs/index');
const { normalize, gini, entropy } = Statistics;

function floatEqual (n1, n2) {
  return Math.abs(n1 - n2) < Number.EPSILON * (2 ** 2);
}

function getRandomArray (size = 2 + Math.round(Math.random() * 1000)) {
  let frequencyList = [];
  for (let i = 0; i < size; i++) {
    frequencyList.push(Math.round(Math.random() * 1000));
  }
  return frequencyList;
}

describe('Impurity Measure test', function () {
  describe('function: normalize', function () {
    let frequencyList = [1,2,3,4,5];//getRandomArray();
    const probabilityList = normalize(frequencyList);
    it('values checks', function () {
      let freSum = 0;
      frequencyList.forEach(f => freSum += f);
      probabilityList.forEach((p, i) => {
        assert.equal(floatEqual(p, frequencyList[i] / freSum), true)
      })
    })
    it('sum_{p} = 1', function () {
      let sum = 0;
      probabilityList.forEach(p => sum += p);
      assert.equal(floatEqual(sum, 1), true);
    })
  })

  describe('function: entropy', function () {
    let size = 100 + Math.round(Math.random() * 100);
    let frequencyList = getRandomArray(size);
    const probabilityList = normalize(frequencyList);
    let ans = entropy(probabilityList);
    it('isNumber', function () {
      assert.notEqual(ans, NaN);
    })
    it('value <=log(k)', function () {
      assert.equal(Math.log2(size) + Number.EPSILON * (2 ** 3) >= ans - Number.EPSILON * (2 ** 3), true);
    })
  })

  describe('function: gini', function () {
    let frequencyList = getRandomArray();
    let probabilityList = normalize(frequencyList);
    let ans = gini(probabilityList);
    it('value <= 1', function () {
        assert.equal(ans <= 1, true);
      })
  })
})