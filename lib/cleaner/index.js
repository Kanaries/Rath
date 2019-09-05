import { deepcopy } from '../utils';
function dropNull(dataSource, dimensions, measures) {
  let data = [];
  for (let record of dataSource) {
    let keep = true;
    for (let dim of dimensions) {
      if (typeof record[dim] === 'undefined' || record[dim] === '') {
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
  return data;
}

export { dropNull }