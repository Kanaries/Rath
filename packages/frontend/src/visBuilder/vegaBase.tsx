import React, { useEffect, useRef, useMemo } from 'react';
import aggregate from 'cube-core';
import embed from 'vega-embed';
import { DataSource, Field } from '../global'
import { baseVis } from '../queries/index';
export const geomTypeMap: {[key: string]: any} = {
  interval: 'bar',
  line: 'line',
  point: 'point',
  // density: 'rect'
  density: 'point'
}
export interface Specification {
  position?: string[];
  color?: string[];
  opacity?: string[];
  size?: string[];
  shape?: string[];
  geomType?: string[];
  facets?: string[];
  page?: string[];
  filter?: string[]
}
interface BaseChartProps {
  defaultAggregated: boolean;
  defaultStack: boolean;
  aggregator: 'sum' | 'mean' | 'count';
  dataSource: DataSource;
  dimensions: string[];
  measures: string[];
  fieldFeatures: Field[];
  schema: Specification;
}

const BaseChart: React.FC<BaseChartProps> = (props) => {
  const {
    defaultAggregated,
    defaultStack,
    aggregator,
    dataSource = [],
    dimensions = [],
    measures = [],
    schema = {},
    fieldFeatures = []
  } = props;

  const container = useRef<HTMLDivElement>(null);
  const aggregatedMeasures = useMemo(() => {
    return measures.map(mea => {
      return {
        op: aggregator,
        field: mea,
        as: `${mea}_${aggregator}`
      }
    })
  }, [measures, aggregator])

  let table = useMemo(() => {
    if (!defaultAggregated) {
      return dataSource
    }
    return aggregate({ dataSource, dimensions, measures, operator: aggregator, asFields: aggregatedMeasures.map(mea => mea.as)})
  }, [defaultAggregated, dataSource, dimensions, measures, aggregator, aggregatedMeasures])

  useEffect(() => {
    if (container.current !== null) {
      if (schema.position && schema.position.length > 0 && schema.geomType && schema.geomType.length > 0) {
        let spec = baseVis(schema, table, dimensions, measures, aggregatedMeasures, fieldFeatures, defaultAggregated, defaultStack);
        embed(container.current, spec);
      }
    }
  }, [schema, table, dimensions, measures, aggregatedMeasures, fieldFeatures, defaultAggregated, defaultStack])
  return <div ref={container}></div>
}

export default BaseChart;