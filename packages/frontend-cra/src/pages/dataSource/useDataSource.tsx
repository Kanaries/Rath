import { useMemo } from 'react';
import { BIField, DataSource, Record } from '../../global';
import { Transform } from '../../utils/index'
import {  cleanData,  CleanMethod } from './clean';
import { deepcopy } from '../../utils/index';


export function useDataSource (rawData: DataSource, fields: BIField[], cleanMethod: CleanMethod): [DataSource, DataSource] {
  const dimensions = useMemo<string[]>(() => {
    return fields.filter(field => field.type === 'dimension').map(field => field.name)
  }, [fields])

  const measures = useMemo<string[]>(() => {
    return fields.filter(field => field.type === 'measure').map(field => field.name)
  }, [fields])

  const dataSource = useMemo<DataSource>(() => {
    return rawData.map(row => {
      let record: Record = {}
      fields.forEach(field => {
        record[field.name] = field.type === 'dimension' ? row[field.name] : Transform.transNumber(row[field.name])
      })
      return record
    })
  }, [rawData, fields])

  const preparedData = useMemo<DataSource>(() => {
    return cleanData(deepcopy(dataSource), dimensions, measures, cleanMethod);
  }, [dimensions, measures, dataSource, cleanMethod])

  return [dataSource, preparedData]
}