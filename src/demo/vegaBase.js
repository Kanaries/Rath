import React, { useEffect, useState, useRef } from 'react';
import { Slider } from 'office-ui-fabric-react';
import embed from 'vega-embed';
const geomTypeMap = {
  interval: 'bar',
  line: 'line',
  point: 'point',
  density: 'rect'
}
const BaseChart = (props) => {
  const [operator, setOperator] = useState('sum');
  const [pageMembers, setPageMembers] = useState([]);
  const [pageNo, setPageNo] = useState(0);
  const {
    dataSource = [],
    dimensions = [],
    measures = [],
    schema: {
      position = [],
      // color = [],
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
  console.log(props)
  const container = useRef();
  function getFieldType (field) {
    let targetField = fieldFeatures.find(f => f.name === field);
    return targetField ? targetField.type : 'nominal';
  }
  const aggregatedMeasures = measures.map(mea => {
    return {
      op: operator,
      field: mea,
      as: `${mea}_${operator}`
    }
  })
  function adjustField (field) {
    if (measures.includes(field)) {
      return aggregatedMeasures.find(mea => {
        return mea.field === field;
      }).as;
    }
    return field;
  }
  function getDomain (field) {
    let fieldType = fieldFeatures.find(f => f.name === field).type;
    let values = dataSource.map(row => row[field]);
    if (fieldType === 'quantitative') {
      let min = Math.min(0, ...values)
      let max = Math.max(...values)
      return [min, max]
    }
    return [...new Set(values)];
  }
  useEffect(() => {
    if (container.current) {
      if (position.length > 0 && geomType.length > 0) {
        let spec = {
          width: 600,
          data: {
            values: page.length > 0 ? dataSource.filter(row => row[page] === pageMembers[pageNo]) : dataSource
          },
          transform: aggregatedMeasures.length > 0 ? [
            {
              aggregate: aggregatedMeasures,
              groupby: dimensions
            }
          ] : undefined,
          mark: geomTypeMap[geomType[0]] ? geomTypeMap[geomType[0]] : geomType[0],
          encoding: {
            x: { field: adjustField(position[0]), type: getFieldType(position[0]), /*scale: {domain: getDomain(position[0])}*/},
            y: { field: adjustField(position[1]), type: getFieldType(position[1]), /*scale: {domain: getDomain(position[1])}*/},
            color: color[0] ? { field: adjustField(color[0]), type: getFieldType(color[0]), /*scale: {domain: getDomain(color[0])}*/} : undefined,
            size: size[0] ? { field: adjustField(size[0]), type: getFieldType(size[0]), /*scale: {domain: getDomain(size[0])}*/} : undefined,
            opacity: opacity[0] ? { field: adjustField(opacity[0]), type: getFieldType(opacity[0]), /*scale: {domain: getDomain(opacity[0])}*/} : undefined,
            row: facets[0] ? { field: adjustField(facets[0]), type: getFieldType(facets[0])} : undefined,
            column: facets[1] ? { field: adjustField(facets[1]), type: getFieldType(facets[1])} : undefined,
          }
        };
        console.log(spec)
        embed(container.current, spec);
      }
    }
  })
  useEffect(() => {
    if (page.length > 0) {
      let pageMemberSet = new Set(dataSource.map(row => row[page]));
      setPageMembers([...pageMemberSet].sort());
      setPageNo(0);
    }
  }, [page, dataSource])
  return <div>
      {
        page.length > 0 ? <Slider
          label="Basic example"
          min={0}
          max={Math.max(0, pageMembers.length - 1)}
          step={1}
          defaultValue={0}
          showValue={true}
          onChange={(value) => setPageNo(value)}
        /> : undefined
      }
      <div ref={container}></div>
      
  </div>
  
}

export default BaseChart;