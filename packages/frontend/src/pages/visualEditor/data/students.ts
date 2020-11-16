import dataSource from './students.json';
import { Record, IField, DataSet } from '../interfaces';

export function getStudentsData(): DataSet {
  const dimensions: string[] = [
    'gender',
    'race/ethnicity',
    'parental level of education',
    'lunch',
    'test preparation course',
  ];
  const measures: string[] = ['math score', 'reading score', 'writing score'];
  (dataSource as Record[]).forEach((record) => {
    dimensions.forEach((dim: string) => {
      if (record[dim] === undefined) record[dim] = null;
      else {
        record[dim] = record[dim].toString();
      }
    });
    measures.forEach((mea) => {
      if (record[mea] === undefined) record[mea] = 0;
      else {
        record[mea] = Number(record[mea]);
      }
    });
  });
  const fields: IField[] = [];
  dimensions.forEach(dim => {
    fields.push({
      key: dim,
      type: 'string',
      analyticType: 'dimension'
    })
  })
  measures.forEach(mea => {
    fields.push({
        key: mea,
        type: 'number',
        analyticType: 'measure',
    });
  })
  return {
    id: 'students',
    name: '学生分数影响因子',
    dataSource,
    fields
  };
}
