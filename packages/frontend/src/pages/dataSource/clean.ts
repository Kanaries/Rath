import { Cleaner } from 'visual-insights';
import { DataSource } from '../../global';

// todo
// cleanMethodList has redundency.
// clean method type, cleanData(switch), cleanMethodList should be maintained in one structure.
export type CleanMethod = 'dropNull' | 'useMode' | 'simpleClean';
export function cleanData (dataSource: DataSource, dimensions: string[], measures: string[], method: CleanMethod): DataSource {
  // hint: dropNull works really bad when we test titanic dataset.
  // useMode fails when there are more null values than normal values;
  switch (method) {
    case 'dropNull':
      return Cleaner.dropNull(dataSource, dimensions, measures);
    case 'useMode':
      // todo: bad props design
      return Cleaner.useMode(dataSource, dimensions.concat(measures));  
    case 'simpleClean':
    default:
      return Cleaner.simpleClean(dataSource, dimensions, measures);
  }
}

export const cleanMethodList: Array<{ key: CleanMethod; text: string }> = [
  { key: 'dropNull', text: 'drop null records' },
  { key: 'useMode', text: 'replace null with mode' },
  { key: 'simpleClean', text: 'simple cleaning' }
]
