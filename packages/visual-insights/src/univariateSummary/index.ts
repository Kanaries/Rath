import { DataSource, Field, FieldImpurity, FieldType, Record } from '../commonTypes';
import { isFieldTime, isFieldContinous, memberCount, isFieldCategory } from '../utils';

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
  members.sort((a, b) => a[1] - b[1]);
  return members.map(m => {
    return { memberName: m[0], count: m[1] }
  })
}

export interface FieldSummary {
  distribution: FieldDistribution;
  fieldName: string;
}
export function getAllFieldsDistribution(dataSource, DataSource, fields: string[]): FieldSummary[] {
  let fieldsDistribution: FieldSummary[] = [];
  for (let field in fields) {
    fieldsDistribution.push({
      fieldName: field,
      distribution: getFieldDistribution(dataSource, field)
    })
  }
  return fieldsDistribution;
}