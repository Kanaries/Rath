import { deepcopy, isFieldNumeric, isFieldTime } from '../utils';
function dropNull(dataSource, dimensions, measures) {
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
      data.forEach(record => {
        record[dim] = Number(record[dim]) || 0
      })
    }
  }
  return data;
}

export { dropNull }