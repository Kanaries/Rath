import {
  deepcopy,
  memberCount,
  groupCategoryField,
  groupContinousField,
  aggregate,
  isFieldCategory,
  isFieldTime,
  isFieldContinous
} from './utils';

import { isUniformDistribution } from './distribution';
import {
  normalize,
  entropy,
  gini
} from './impurityMeasure';

const MAGIC_NUMBER = 5;

function fieldsAnalysis(rawData, dimensions, measures) {
  // 1. process fields
  // 2. aggregate
  // 3. calculate field entropy
  // 4. give the high entropy fields with high delta I aesthics 

  let dataSource = deepcopy(rawData);
  let aggDims = new Set(dimensions);

  // find all the field with too much members, group them. reduce the entropy of a field.
  for (let dim of dimensions) {
    if (isFieldTime(dataSource, dim)) {
      continue;
    } else if (isFieldContinous(dataSource, dim) && memberCount(dataSource, dim) > MAGIC_NUMBER * MAGIC_NUMBER) {
      let newField = `${dim}(con-group)`;
      dataSource = groupContinousField({
        dataSource,
        field: dim,
        newField,
        groupNumber: MAGIC_NUMBER
      });
      aggDims.delete(dim)
      aggDims.add(newField);

    } else if (isFieldCategory(dataSource, dim) && !isUniformDistribution(dataSource, dim)) {

      const members = memberCount(dataSource, dim);
      if (members.length > MAGIC_NUMBER * MAGIC_NUMBER) {
        let newField = `${dim}(cat-group)`;
        dataSource = groupCategoryField({
          dataSource,
          field: dim,
          newField,
          groupNumber: MAGIC_NUMBER
        });
        aggDims.delete(dim)
        aggDims.add(newField);
      }
    }
  }

  let aggData = aggregate({
    dataSource,
    fields: [...aggDims.values()],
    bys: measures,
    method: 'sum'
  })
  let newDimensions = [...aggDims.values()];
  for (let mea of measures) {
    aggDims.add(mea);
  }
  
  let dimScores = [];
  for (let dim of aggDims) {
    const members = memberCount(aggData, dim);
    // console.log(`=========[${dim} members]========`)
    // console.log(members)
    const frequencyList = members.map(m => m[1]);
    const probabilityList = normalize(frequencyList);
    const fieldEntropy = entropy(probabilityList);
    // console.log(`[${dim} filed entropy] = ${fieldEntropy}`)
    dimScores.push([dim, fieldEntropy, Math.log2(members.length)]);
  }

  dimScores.sort((a, b) => a[1] - b[1]);
  return { dimScores, newDimensions, aggData, mapData: dataSource };
}

export default fieldsAnalysis