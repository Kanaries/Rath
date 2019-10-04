const assert = require('assert');
const { Distribution } = require('../build/cjs/index');

const RANDOM_TEST_GROUP = 10;

function mock (field = 'mock_test', isUniform = true) {
  const memberSize = Math.round(Math.random() * 100);
  const size = memberSize + Math.round(Math.random() * 500);
  let dataSource = [];
  for (let i = 0; i < memberSize; i++) {
    dataSource.push({
      [field]: `member-${i}`
    })
  }
  if (!isUniform) {
    for (let i = memberSize; i < size; i++) {
      dataSource.push({
        [field]: `member-${Math.round(Math.random() * memberSize) % memberSize}` // may get ceil number!!
      })
    }
  }
  return dataSource
}

describe('distribution test', function () {
  describe('[uniform distribution]', function () {
    it('function: isUniformDistribution', function () {
      const { isUniformDistribution } = Distribution;
      for (let i = 0; i < RANDOM_TEST_GROUP; i++) {
        const positiveData = mock('positive_test', true);
        const negativeData = mock('negative_test', false);
        assert.equal(isUniformDistribution(positiveData, 'positive_test'), true);
        assert.equal(isUniformDistribution(negativeData, 'negative_test'), false);
      }
    })
  })
})