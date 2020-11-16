import titanic from './titanic.json';
import { Record, IField, DataSet } from '../interfaces';
import { Cleaner } from 'visual-insights';

export function getTitanicData(): DataSet {
  const { dataSource, config } = titanic;
  const { Dimensions: dimensions, Measures: measures } = config;
  (dataSource as Record[]).forEach(record => {
    dimensions.forEach((dim: string) => {
      if (record[dim] === undefined) record[dim] = null;
      else {
        record[dim] = record[dim].toString();
      }
    })
    measures.forEach(mea => {
      if (record[mea] === undefined) record[mea] = 0;
      else {
        record[mea] = Number(record[mea])
      }
    })
  })
  const fields: IField[] = [];
  dimensions.forEach((dim) => {
      fields.push({
          key: dim,
          type: 'string',
          analyticType: 'dimension',
      });
  });
  measures.forEach((mea) => {
      fields.push({
          key: mea,
          type: 'number',
          analyticType: 'measure',
      });
  });
  return {
    id: 'titanic',
    name: '泰坦尼克号',
    dataSource: Cleaner.dropNull(dataSource, dimensions, measures),
    fields
  };
}
