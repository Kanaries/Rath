import { Cleaner } from 'visual-insights';
import { DataSource } from '../../global';

const { dropNull, simpleClean, useMode } = Cleaner;

// todo
// cleanMethodList has redundency.
// clean method type, cleanData(switch), cleanMethodList should be maintained in one structure.
export type CleanMethod = 'dropNull' | 'useMode' | 'simpleClean';
export function cleanData (dataSource: DataSource, dimensions: string[], measures: string[], method: CleanMethod): DataSource {
  // hint: dropNull works really bad when we test titanic dataset.
  // useMode fails when there are more null values than normal values;
  switch (method) {
    case 'dropNull':
      return dropNull(dataSource, dimensions, measures);
    case 'useMode':
      // todo: bad props design
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useMode(dataSource, dimensions.concat(measures));  
    case 'simpleClean':
    default:
      return simpleClean(dataSource, dimensions, measures);
  }
}

export const cleanMethodList: Array<{ key: CleanMethod; text: string }> = [
  { key: 'dropNull', text: 'drop null records' },
  { key: 'useMode', text: 'replace null with mode' },
  { key: 'simpleClean', text: 'simple cleaning' }
]
