import React, { useEffect, useRef } from 'react';
import aggregate from 'cube-core';
import embed from 'vega-embed';
import { DataSource, Field, FieldType } from '../global'
const geomTypeMap: {[key: string]: any} = {
  interval: 'bar',
  line: 'line',
  point: 'point',
  density: 'rect'
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
    schema: {
      position = [],
      color = [],
      opacity = [],
      size = [],
      shape = [],
      geomType = [],
      facets = [],
      page = [],
      filter = []
    },
    fieldFeatures = []
  } = props;

  const container = useRef<HTMLDivElement>(null);

  function getFieldType (field: string): FieldType {
    let targetField = fieldFeatures.find(f => f.name === field);
    return targetField ? targetField.type : 'nominal';
  }

  const aggregatedMeasures = measures.map(mea => {
    return {
      op: aggregator,
      field: mea,
      as: `${mea}_${aggregator}`
    }
  })
  let table = defaultAggregated ? aggregate({ dataSource, dimensions, measures, operator: aggregator, asFields: aggregatedMeasures.map(mea => mea.as)}) : dataSource;
  function adjustField (fieldName: string): string {
    if (defaultAggregated && measures.includes(fieldName)) {
      let aggField = aggregatedMeasures.find(mea => {
        return mea.field === fieldName;
      });
      return aggField ? aggField.as : fieldName;
    }
    return fieldName;
  }
  // todo for slider
  // function getDomain (field) {
  //   let fieldType = fieldFeatures.find(f => f.name === field).type;
  //   let values = table.map(row => row[field]);
  //   if (fieldType === 'quantitative') {
  //     let min = Math.min(0, ...values)
  //     let max = Math.max(...values)
  //     return [min, max]
  //   }
  //   return [...new Set(values)];
  // }
  function getSpecification () {
    console.log( container.current && container.current.offsetWidth)
    let chartWidth = 600; //container.current ? container.current.offsetWidth * 0.8 : 600;
    const fieldMap: any = {
      x: position[0],
      y: position[1],
      color: color[0],
      size: size[0],
      opacity: opacity[0],
      row: facets[0],
      column: facets[1]
    }
    let spec: any = {
      width: chartWidth,
      data: {
        values: table
      }
    }
    let basicSpec: any = {
      width: chartWidth,
      mark: (geomType[0] && geomTypeMap[geomType[0]]) ? geomTypeMap[geomType[0]] : geomType[0],
      encoding: {}
    };
    for (let channel in fieldMap) {
      if (fieldMap[channel]) {
        basicSpec.encoding[channel] = {
          field: adjustField(fieldMap[channel]),
          type: getFieldType(fieldMap[channel])
        }
        if (['x', 'y'].includes(channel) && getFieldType(fieldMap[channel]) === 'quantitative' && !defaultStack) {
          basicSpec.encoding[channel].stack = null;
        }
      }
    }
    if (!defaultStack && opacity.length === 0) {
      basicSpec.encoding.opacity = { value: 0.7 }
    }
    if (page.length === 0) {
      spec = {
        ...spec,
        ...basicSpec
      }
    } else if (page.length > 0) {
      basicSpec.transform = [
        {filter: {selection: 'brush'}},
        defaultAggregated ? {
          aggregate: aggregatedMeasures,
          groupby: dimensions.filter(dim => dim !== page[0])
        } : null
      ].filter(Boolean);
      let sliderSpec = {
        width: chartWidth,
        mark: 'tick',
        selection: { brush: { encodings: ['x'], type: 'interval'}},
        encoding: {
          x: { field: page[0], type: getFieldType(page[0]) }
        }
      }
      spec.vconcat = [basicSpec, sliderSpec];
    }
    return spec;
  }
  useEffect(() => {
    if (container.current !== null) {
      if (position.length > 0 && geomType.length > 0) {
        let spec = getSpecification()
        // console.log(spec)
        embed(container.current, spec);
      }
    }
  })
  return <div ref={container}></div>
  
}

export default BaseChart;