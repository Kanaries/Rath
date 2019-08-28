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

function aggregate({ dataSource, fields, by, method = 'sum' }) {
  const map = new Map();
  let newField = fields.join('_')
  for (let record of dataSource) {
    let key = fields.map(field => record[field]).join('_');
    if (!map.has(key)) {
      map.set(key, 0)
    }
    map.set(key, map.get(key) + record[by]);
  }

  let ans = []
  for (let [key, value] of map) {
    ans.push({
      [newField]: key,
      value 
    })
  }
  return ans;
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
  const max = Math.max(...values) + Number.EPSILON;
  const min = Math.min(...values);
  const segWidth = (max - min) / groupNumber;
  let ranges = [];

  for (let i = 0; i < groupNumber; i++) {
    let left = min + i * segWidth;
    let right = min + (i + 1) * segWidth;
    ranges.push([left, right]);
  }

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
  let members = memberCount(dataSource, field);
  members.sort((a, b) => b[1] - a[1]);
  let set = new Set()
  // let sum = 0;
  for (let i = groupNumber; i < members.length; i++) {
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
  isFieldContinous
}