const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { Utils } = require('../build/cjs/index');
const {
  deepcopy,
  memberCount,
  groupCategoryField,
  groupContinousField,
  aggregate,
  isFieldCategory,
  isFieldContinous,
  isFieldUnique
} = Utils;
const dataPath = path.resolve(__dirname, './dataset/titanic.json');
const data = JSON.parse(fs.readFileSync(dataPath).toString())
const { dataSource, config: {Dimensions: dimensions, Measures: measures}} = data;

describe('utils test', function () {
  it('deepcopy', function () {
    let copy = deepcopy(data);
    assert.deepEqual(copy, data);
    assert.notEqual(copy, data);
  })

  it('function: memberCount', function () {
    for (let dim of dimensions) {
      const members = memberCount(dataSource, dim);
      const fieldCheck = members.every(member => {
        let count = 0;
        for (let row of dataSource) {
          if (row[dim] === member[0]) {
            count++;
          }
        }
        return count === member[1];
      });
      assert.equal(fieldCheck, true);
    }
  });

  it('function: groupContinousField', function () {
    // group function here has side effects which is a trade off of efficiency and design.
    const field = 'Age';
    const newField = field + '(group)';
    let data = deepcopy(dataSource);
    data = groupContinousField({
      dataSource: data,
      field,
      newField,
      groupNumber: 6
    });
    let t = true;
    for (let row of data) {
      if (typeof row[field] === 'number') {
        let { groups: { left, right } } = /.*\[(?<left>([0-9.e+]+|-Infinity)), (?<right>[0-9.e+]+|Infinity)\)/.exec(row[newField]);
          left = Number(left);
          right = Number(right);
          if (!(left <= row[field] && row[field] <= right)) {
            t = false;
          }
      } else {
        // bad design
        t = row[newField] === 'null' ? true : false;
      }
      
    }
    assert.equal(t, true);
  })

  // it('function: groupCategoryField', function () {
  //   const field = 'Parch';
  //   const newField = field + '(group)';
  //   let data = deepcopy(dataSource);
  //   data = groupCategoryField({
  //     dataSource: data,
  //     field,
  //     newField,
  //     // groupNumber: 4
  //   });
  //   // todo: how to design this test.
  //   const groupSet = new Set(data.map(d => d[newField]));
  //   assert.equal(groupSet.size, 4);
  // })

  it('function: aggregate', function () {
    const result = aggregate({
      dataSource,
      fields: dimensions,
      bys: measures,
      method: 'sum'
    });
    let test = result.every(aggRow => {
      let sum = measures.map(m => 0);
      for (let row of dataSource) {
        if (dimensions.every(dim => aggRow[dim] === row[dim])) {
          // cannot be strict equal because join&split change the type of value, so the solution here we use json.parse&stringify instead.
          measures.forEach((m, i) => {
            sum[i] += row[m];
          })
        }
      }
      return measures.every((m, i) => sum[i] === aggRow[m]);
    });
    assert.equal(test, true);
  })

  it('isFieldCategory', function () {
    assert.equal(isFieldCategory(dataSource, 'Pclass'), true);
    assert.equal(isFieldCategory(dataSource, 'Name'), true);
    assert.equal(isFieldCategory(dataSource, 'Count'), false);
    assert.equal(isFieldCategory(dataSource, 'Parch'), false);
  })

  it('isFieldContinous', function () {
    assert.equal(isFieldContinous(dataSource, 'Pclass'), false);
    assert.equal(isFieldContinous(dataSource, 'Name'), false);
    assert.equal(isFieldContinous(dataSource, 'Count'), true);
    assert.equal(isFieldContinous(dataSource, 'Parch'), true);
  })

  it('isFieldUnique', function () {
    assert.equal(isFieldUnique(dataSource, 'PassengerId'), true);
    assert.equal(isFieldUnique(dataSource, 'Name'), true);
    assert.equal(isFieldUnique(dataSource, 'Pclass'), false);
    assert.equal(isFieldUnique(dataSource, 'Parch'), false);
  })
})