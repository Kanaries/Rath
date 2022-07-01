import { useMemo } from 'react';
import { BIField } from '../../global';
import { Transform } from '../../utils/index'
import {  cleanData,  CleanMethod } from './clean';
import { deepcopy } from '../../utils/index';
import { IRow } from '../../interfaces';


export function useDataSource (rawData: IRow[], fields: BIField[], cleanMethod: CleanMethod): [IRow[], IRow[]] {
  const dimensions = useMemo<string[]>(() => {
    return fields.filter(field => field.type === 'dimension').map(field => field.name)
  }, [fields])

  const measures = useMemo<string[]>(() => {
    return fields.filter(field => field.type === 'measure').map(field => field.name)
  }, [fields])

  const dataSource = useMemo<IRow[]>(() => {
    return rawData.map(row => {
      let record: IRow = {}
      fields.forEach(field => {
        record[field.name] = field.type === 'dimension' ? row[field.name] : Transform.transNumber(row[field.name])
      })
      return record
    })
  }, [rawData, fields])

  const preparedData = useMemo<IRow[]>(() => {
    return cleanData(deepcopy(dataSource), dimensions, measures, cleanMethod);
  }, [dimensions, measures, dataSource, cleanMethod])

  return [dataSource, preparedData]
}