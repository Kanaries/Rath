const JOIN_SYMBOL = '_';

function deepcopy(data) {
  return JSON.parse(JSON.stringify(data))
}

function isFieldCategory(dataSource, field) {
  return dataSource.every(record => {
    return typeof record[field] === 'string'
      || typeof record[field] === 'undefined'
      || record[field] === null;
  });
}

function isFieldContinous(dataSource, field) {
  return dataSource.every(record => {
    return typeof record[field] === 'number'
      || typeof record[field] === 'undefined'
      || record[field] === null;
  });
}

function aggregate({ dataSource, fields, bys, method = 'sum' }) {
  let tmp = [];

  for (let by of bys) {
    let map = new Map();
    for (let record of dataSource) {
      let key = JSON.stringify(fields.map(field => record[field]));
      if (!map.has(key)) {
        map.set(key, 0);
      }
      map.set(key, map.get(key) + record[by]);
    }
  
    for (let [key, value] of map) {
      let row = {
        index: key,
        [by]: value
      };
      let dims = JSON.parse(key);
      for (let i = 0; i < fields.length; i++) {
        row[fields[i]] = dims[i]
      }

      tmp.push(row)
    }
  }

  let ans = new Map();
  for (let record of tmp) {
    if (!ans.has(record.index)) {
      ans.set(record.index, {})
    }
    ans.set(record.index, { ...ans.get(record.index), ...record })
  }
  return [...ans.values()];
}

function memberCount(dataSource, field) {
  const counter = new Map();

  for (let row of dataSource) {
    let member = row[field];
    if (!counter.has(member)) {
      counter.set(member, 0);
    }
    counter.set(member, counter.get(member) + 1);
  }

  return [...counter.entries()];
}

function groupContinousField({ dataSource, field, newField = `${field}(group)`, groupNumber }) {
  // const members = memberCount(dataSource, field);
  // todo: outlier detection
  const values = dataSource.map(item => item[field])
  const max = Math.max(...values); // Number.EPSILON * ;
  const min = Math.min(...values);
  const segWidth = (max - min) / groupNumber;
  let ranges = [];

  for (let i = 0; i < groupNumber; i++) {
    let left = min + i * segWidth;
    let right = min + (i + 1) * segWidth;
    ranges.push([left, right]);
  }
  ranges[0][0] = -Infinity;
  ranges[ranges.length - 1][1] = Infinity;

  for (let record of dataSource) {
    let range = ranges.find(r => (r[0] <= record[field] && record[field] < r[1]));
    if (typeof range !== 'undefined') {
      record[newField] = `[${range[0]}, ${range[1]})`;
    } else {
      record[newField] = 'null';
    }
  }

  return dataSource;
}

function groupCategoryField({ dataSource, field, newField = `${field}(group)`, groupNumber }) {
  // auto category should obey Power law distrubution.
  let members = memberCount(dataSource, field);
  members.sort((a, b) => b[1] - a[1]);
  let set = new Set()
  // let sum = 0;
  for (let i = groupNumber - 1; i < members.length; i++) {
    // sum += members[i][1];
    set.add(members[i][0]);
  }
  for (let record of dataSource) {
    if (set.has(record[field])) {
      record[newField] = 'others';
    } else {
      record[newField] = record[field];
    }
  }
  return dataSource;
}

export {
  deepcopy,
  memberCount,
  groupCategoryField,
  groupContinousField,
  aggregate,
  isFieldCategory,
  isFieldContinous,
  JOIN_SYMBOL
}