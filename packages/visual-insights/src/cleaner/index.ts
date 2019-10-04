import { isFieldNumeric, isFieldTime, memberCount } from '../utils';
import { DataSource } from '../commonTypes';
function dropNull(dataSource: DataSource, dimensions: string[], measures: string[]): DataSource {
  let data = [];
  for (let record of dataSource) {
    let keep = true;
    for (let dim of dimensions) {
      if (typeof record[dim] === 'undefined' || record[dim] === '' || record[dim] === null) {
        keep = false;
      }
    }
    for (let mea of measures) {
      if (typeof record[mea] !== 'number') {
        keep = false;
      }
    }
    if (keep) {
      data.push(record);
    }
  }
  for (let dim of dimensions) {
    if (isFieldNumeric(data, dim)) {
      let members = memberCount(data, dim);
      if (members.length > 20) {
        data.forEach(record => {
          record[dim] = Number(record[dim]) || 0
        })
      } else {
        data.forEach(record => {
          record[dim] = (Number(record[dim]) || 0).toString()
        })
      }
    }
  }
  return data;
}

export { dropNull }