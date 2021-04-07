import { useObserver } from 'mobx-react-lite';
import { useMemo } from 'react';
import intl from "react-intl-universal";
import { Cleaner } from 'visual-insights';
import { DataSource } from '../../global';
import { useGlobalStore } from '../../store';

const { dropNull, simpleClean, useMode } = Cleaner;

// todo
// cleanMethodList has redundency.
// clean method type, cleanData(switch), cleanMethodList should be maintained in one structure.
export type CleanMethod = 'dropNull' | 'useMode' | 'simpleClean' | 'none';
function unClean(dataSource: DataSource) {
  return [...dataSource];
}
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
      return simpleClean(dataSource, dimensions, measures);
    case 'none':
    default:
      return unClean(dataSource);
  }
}

export const cleanMethodList: Array<{ key: CleanMethod; text: string }> = [
  { key: 'dropNull', text: 'drop null records' },
  { key: 'useMode', text: 'replace null with mode' },
  { key: 'simpleClean', text: 'simple cleaning' },
  { key: 'none', text: 'none' }
]

export const useCleanMethodList = function (): typeof cleanMethodList {
  const { langStore } = useGlobalStore();
  const lang = useObserver(() =>  langStore.lang);
  return useMemo(() => {
    return cleanMethodList.map((m) => {
        return {
            key: m.key,
            text: intl.get(`dataSource.methods.${m.key}`),
        };
    });
  }, [lang])
}
