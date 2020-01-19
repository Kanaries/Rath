/**
 * todo: delete this file, fieldsAnalysis is an old api.
 */
import { DataSource, Field, FieldImpurity } from './commonTypes'

import {
  deepcopy,
  memberCount,
  groupCategoryField,
  groupContinousField,
  aggregate,
  isFieldCategory,
  // isFieldNumeric,
  isFieldTime,
  isFieldContinous
} from './utils/index';

import { isUniformDistribution } from './distribution';
import { normalize, entropy } from './statistics/index';

const MAGIC_NUMBER = 5;

function fieldsAnalysis(rawData: DataSource, dimensions: string[], measures: string[]) {
  // 1. process fields
  // 2. aggregate
  // 3. calculate field entropy
  // 4. give the high entropy fields with high delta I aesthics 

  let dataSource: DataSource = deepcopy(rawData);
  let aggDims = new Set(dimensions);
  let fieldFeatureList: Field[] = []
  // find all the field with too much members, group them. reduce the entropy of a field.
  for (let dim of dimensions) {
    if (isFieldTime(dataSource, dim)) {
      fieldFeatureList.push({
        name: dim,
        type: 'temporal'
      })
    } else if (isFieldContinous(dataSource, dim)) {
      if (memberCount(dataSource, dim).length > MAGIC_NUMBER * MAGIC_NUMBER) {
        let newField = `${dim}(con-group)`;
        dataSource = groupContinousField({
          dataSource,
          field: dim,
          newField,
          groupNumber: MAGIC_NUMBER
        });
        aggDims.delete(dim);
        aggDims.add(newField);
        fieldFeatureList.push({
          name: newField,
          type: 'ordinal'
        })
      } else {
        fieldFeatureList.push({
          name: dim,
          type: 'quantitative'
        })
      }
      

    } else if (isFieldCategory(dataSource, dim) && !isUniformDistribution(dataSource, dim)) {

      const members = memberCount(dataSource, dim);
      let newField = dim;
      if (members.length > MAGIC_NUMBER * MAGIC_NUMBER) {
        newField = `${dim}(cat-group)`
        dataSource = groupCategoryField({
          dataSource,
          field: dim,
          newField,
          groupNumber: MAGIC_NUMBER
        });
        aggDims.delete(dim)
        aggDims.add(newField);
      }
      fieldFeatureList.push({
        name: newField,
        type: 'nominal'
      })
    } else {
      fieldFeatureList.push({
        name: dim,
        type: 'nominal'
      })
    }
  }

  let aggData = aggregate({
    dataSource,
    fields: [...aggDims.values()],
    bys: measures,
    method: 'sum'
  })
  for (let mea of measures) {
    aggDims.add(mea);
    fieldFeatureList.push({
      name: mea,
      type: 'quantitative'
    })
  }
  
  let dimScores: FieldImpurity[] = [];
  for (let dim of aggDims) {
    const members = memberCount(aggData, dim);
    const frequencyList = members.map(m => m[1]);
    const probabilityList = normalize(frequencyList);
    const fieldEntropy = entropy(probabilityList);
    dimScores.push([dim, fieldEntropy, Math.log2(members.length), fieldFeatureList.find(item => item.name === dim)]);
  }

  dimScores.sort((a, b) => a[1] - b[1]);
  return { dimScores, aggData, mapData: dataSource };
}

export default fieldsAnalysis