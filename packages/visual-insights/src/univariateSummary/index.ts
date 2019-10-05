import { DataSource, Field, FieldImpurity, FieldType, Record } from '../commonTypes';
import { isFieldTime, isFieldContinous, memberCount, isFieldCategory, deepcopy, groupContinousField, groupCategoryField } from '../utils';
import { normalize, entropy } from '../impurityMeasure';
import { isUniformDistribution } from '../distribution';

const MIN_QUAN_MEMBER_SIZE = 25;

export function getFieldType(dataSource: DataSource, field: string): FieldType {
  if (isFieldTime(dataSource, field)) {
    return 'temporal'
  } else if (isFieldContinous(dataSource, field)) {
    if (memberCount(dataSource, field).length > MIN_QUAN_MEMBER_SIZE) {
      return 'quantitative'
    } else {
      return 'ordinal';
    }
  } else if (isFieldCategory(dataSource, field)) {
    // isFieldCategory is a safety checking here, for sometimes dirty data value can be object.
    return 'nominal'
  } else {
    // todo do something(like cleaning)
    return 'nominal'
  }
}

export function getAllFieldTypes(dataSource: DataSource, fields: string[]): Field[] {
  let fieldsWithType: Field[] = [];
  for (let field of fields) {
    fieldsWithType.push({
      name: field,
      type: getFieldType(dataSource, field)
    })
  }
  return fieldsWithType;
}

// get the original distribution(shall not group the field) for a field.

export interface Member extends Record {
  memberName: string;
  count: number;
}
export type FieldDistribution = Member[];
export function getFieldDistribution(dataSource: DataSource, field: string): FieldDistribution {
  let members = memberCount(dataSource, field);
  // members.sort((a, b) => a[1] - b[1]);
  return members.map(m => {
    return { memberName: m[0], count: m[1] }
  })
}

export interface FieldSummary {
  distribution: FieldDistribution;
  fieldName: string;
}
export function getAllFieldsDistribution(dataSource: DataSource, fields: string[]): FieldSummary[] {
  let fieldsDistribution: FieldSummary[] = [];
  for (let field of fields) {
    fieldsDistribution.push({
      fieldName: field,
      distribution: getFieldDistribution(dataSource, field)
    })
  }
  return fieldsDistribution;
}

export interface FieldEntropy {
  fieldName: string;
  entropy: number;
  /**
   * potentional max entropy of this field, log(count(members))
   */
  maxEntropy: number;
}
export function getFieldEntropy(dataSource: DataSource, field: string): FieldEntropy {
  const members = memberCount(dataSource, field);
  const frequencyList = members.map(m => m[1]);
  const probabilityList = normalize(frequencyList);
  const fieldEntropy = entropy(probabilityList);
  const maxEntropy = Math.log2(members.length)
  return {
    fieldName: field,
    entropy: fieldEntropy,
    maxEntropy
  }
}

export function getAllFieldsEntropy(dataSource: DataSource, fields: string[]): FieldEntropy[] {
  let fieldEntropyList: FieldEntropy[] = [];
  for (let field of fields) {
    fieldEntropyList.push(getFieldEntropy(dataSource, field))
  }
  return fieldEntropyList
}

interface GroupResult {
  groupedData: DataSource,
  newFields: Field[]
}
export function groupFields(dataSource: DataSource, fields: Field[]): GroupResult {
  let groupedData: DataSource = deepcopy(dataSource);
  let newFields: Field[] = [];
  for (let field of fields) {
    let newFieldName = `${field.name}(group)`;
    if (field.type === 'quantitative' && memberCount(dataSource, field.name).length > MIN_QUAN_MEMBER_SIZE * 2) {
      groupedData = groupContinousField({
        dataSource: groupedData,
        field: field.name,
        newField: newFieldName,
        groupNumber: 8
      })
      newFields.push({
        name: newFieldName,
        type: 'ordinal'
      })
    } else if ((field.type === 'ordinal' || field.type === 'temporal') && memberCount(dataSource, field.name).length > MIN_QUAN_MEMBER_SIZE) {
      if (!isUniformDistribution(dataSource, field.name)) {
        groupedData = groupCategoryField({
          dataSource: groupedData,
          field: field.name,
          newField: newFieldName,
          groupNumber: 8
        })
        newFields.push({
          name: newFieldName,
          type: field.type
        })
      }
    }
  }
  return {
    groupedData,
    newFields: fields.concat(newFields)
  }
}