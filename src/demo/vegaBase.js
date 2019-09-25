import React, { useEffect, useState, useRef } from 'react';
import embed from 'vega-embed';
const geomTypeMap = {
  interval: 'bar',
  line: 'line',
  point: 'point'
}
const BaseChart = (props) => {
  const {
    dataSource = [],
    dimensions = [],
    measures = [],
    schema: {
      position = [],
      // color = [],
      'adjust&color': color = [],
      opacity = [],
      size = [],
      shape = [],
      geomType = [],
      facets = []
    }
  } = props;
  const container = useRef();
  useEffect(() => {
    if (container.current) {
      if (position.length > 0 && geomType.length > 0) {
        let spec = {
          width: 600,
          data: {
            values: dataSource
          },
          mark: geomTypeMap[geomType[0]] ? geomTypeMap[geomType[0]] : geomType[0],
          encoding: {
            x: {field: position[0], type: 'ordinal'},
            y: {field: position[1], type: 'quantitative'},
            color: color.length > 0 ? { field: color[0], type: 'nominal'} : undefined,
            column: facets[0] ? { field: facets[0], type: 'nominal'} : undefined,
            row: facets[1] ? { field: facets[1], type: 'nominal'} : undefined,
          }
        };
        embed(container.current, spec);
      }
    }
  })
  return <div ref={container}></div>
}

export default BaseChart;