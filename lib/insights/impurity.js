import { aggregate } from '../utils';
import { entropy, normalize } from '../impurityMeasure';
// insights like outlier and trend both request high impurity of dimension.
function linearMapPositive (arr) {
  let min = Math.min(...arr);
  return arr.map(a => a + min + 1);
}

function sum(arr) {
  let sum = 0;
  for (let i = 0, len = arr.length; i < len; i++) {
    // if (typeof dataSource[i][field])
    sum += arr[i];
  }
  return sum;
}

function correlation(dataSource, fieldX, fieldY) {
  let r = 0;
  let xBar = sum(dataSource.map(r => r[fieldX]));
  let yBar = sum(dataSource.map(r => r[fieldY]));
  r = sum(dataSource.map(r => (r[fieldX] - xBar) * (r[fieldY] - yBar))) /
  Math.sqrt(sum(dataSource.map(r => Math.pow(r[fieldX] - xBar, 2))) * sum(dataSource.map(r => Math.pow(r[fieldY] - yBar, 2))));
  return r;
}

function analysisDimensions(dataSource, dimensions, measures) {
  let impurityList = [];
  for (let dim of dimensions) {
    let impurity = {};
    let aggData = aggregate({
      dataSource,
      fields: [dim],
      bys: measures
    });
    // let fList = aggData.map(r => r)
    for (let mea of measures) {
      // fl = frequency list, pL = probability list
      let fL = aggData.map(r => r[mea]);
      let pL = normalize(linearMapPositive(fL));
      let value = entropy(pL);
      impurity[mea] = value;
    }
    let correlationMatrix = measures.map(i => measures.map(j => 0));
      for (let i = 0; i < measures.length; i++) {
        correlationMatrix[i][i] = 1;
        for (let j = i + 1; j < measures.length; j++) {
          let r = correlation(aggData, measures[i], measures[j]);
          correlationMatrix[j][i] = correlationMatrix[i][j] = r;
        }
      }
    impurityList.push([[dim], impurity, correlationMatrix]);
  }
  return impurityList
}

export { analysisDimensions }