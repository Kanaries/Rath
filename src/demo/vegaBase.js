import React, { useEffect, useState, useRef } from 'react';
import { Slider } from 'office-ui-fabric-react';
import aggregate from 'cube-core';
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
  let table = aggregate({ dataSource, dimensions, measures, operator, asFields: aggregatedMeasures.map(mea => mea.as)});
  function adjustField (field) {
    if (measures.includes(field)) {
      return aggregatedMeasures.find(mea => {
        return mea.field === field;
      }).as;
    }
    return field;
  }
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
    const fieldMap = {
      x: position[0],
      y: position[1],
      color: color[0],
      size: size[0],
      opacity: opacity[0],
      row: facets[0],
      column: facets[1]
    }
    let spec = {
      width: 600,
      data: {
        values: table
      }
    }
    let basicSpec = {
      width: 600,
      mark: geomTypeMap[geomType[0]] ? geomTypeMap[geomType[0]] : geomType[0],
      encoding: {}
    };
    for (let channel in fieldMap) {
      if (fieldMap[channel]) {
        basicSpec.encoding[channel] = {
          field: adjustField(fieldMap[channel]),
          type: getFieldType(fieldMap[channel])
        }
      }
    }
    if (page.length === 0) {
      spec = {
        ...spec,
        ...basicSpec
      }
    } else if (page.length > 0) {
      basicSpec.transform = [
        {filter: {selection: 'brush'}},
        {
          aggregate: aggregatedMeasures,
          groupby: dimensions.filter(dim => dim !== page[0])
        }
      ];
      let sliderSpec = {
        width: 600,
        // height: 150,
        mark: 'tick',
        selection: { brush: { encodings: ['x'], type: 'interval'}},
        encoding: {
          x: { field: page[0], type: getFieldType(page[0]) }
        }
        // selection: {}
      }
      spec.vconcat = [basicSpec, sliderSpec];
    }
    return spec;
  }
  useEffect(() => {
    if (container.current) {
      if (position.length > 0 && geomType.length > 0) {
        let spec = getSpecification()
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
  return <div ref={container}></div>
  
}

export default BaseChart;