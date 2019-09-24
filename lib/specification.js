import fieldsAnalysis from './fieldAnalysis';
import {
  // isFieldCategory,
  // isFieldContinous,
  memberCount
} from './utils';

const visualElements = [
  ['position', 2],
  ['adjust&color', 1],
  ['facets', 2],
  ['size', 1],
  ['shape', 1],
  // ['color', 1],
  ['opacity', 1],
  ['high-facets', Infinity]
];

const geomTypes = {
  interval: [0, 20],
  line: [21, Infinity],
  area: [21, Infinity],
  point: [0, 1000],
  path: [0, 100],
  polygon: [1001, Infinity]
}

function specification (dataSource, dimensions, measures) {
  const { dimScores, aggData } = fieldsAnalysis(dataSource, dimensions, measures);
  let viewDimensions = dimScores.map(dim => dim[0]);
  for (let mea of measures) {
    let meaIndex = viewDimensions.indexOf(mea);
    if (meaIndex > -1) {
      viewDimensions.splice(meaIndex, 1);
    }
  }
  viewDimensions.splice()
  // let visPos = 0;
  let schema = {};
  let dimIndex = dimScores.length - 1;
  for (let visPos = 0; visPos < visualElements.length && dimIndex >= 0; visPos++) {
    let left = visualElements[visPos][1];
    if (typeof schema[visualElements[visPos][0]] === 'undefined') {
      schema[visualElements[visPos][0]] = []
    }
    while(left > 0 && dimIndex >= 0) {
      schema[visualElements[visPos][0]].push(dimScores[dimIndex][0]);
      dimIndex--;
      left--;
    }
  }
  // todo: design a better rule for choosing geom type.
  if (schema.position.length === 2) {
    // if ((isFieldCategory(dataSource, schema.position[0]) && isFieldCategory(dataSource, schema.position[0])) ||
    // (isFieldCategory(dataSource, schema.position[1]) && isFieldCategory(dataSource, schema.position[0]))) {
    //   schema.geomType = ['interval', 'line', 'point', 'area'];
    // } else {
    //   schema.geomType = ['line', 'point', 'area'];
    // }
    if ((viewDimensions.indexOf(schema.position[0]) > -1 && measures.indexOf(schema.position[1]) > -1) ||
      (viewDimensions.indexOf(schema.position[1]) > -1 && measures.indexOf(schema.position[0]) > -1)) {
      const dimIndex = viewDimensions.indexOf(schema.position[0]) > -1 ? 0 : 1;
      const dim = schema.position[dimIndex];
      const mea = schema.position[(dimIndex + 1) % 2];
      schema.position = [dim, mea];
      const dimMembers = memberCount(aggData, dim);
      schema.geomType = ['interval', 'line', 'area'].filter(geom => {
        return dimMembers.length >= geomTypes[geom][0] && dimMembers.length <= geomTypes[geom][1];
      });
      console.log(dimMembers, schema.geomType)
    } else {
      // ['point', 'path', 'heatmap']
      schema.geomType = ['point', 'path', 'polygon'].filter(geom => {
        return aggData.length >= geomTypes[geom][0] && aggData.length <= geomTypes[geom][1];
      });
    }
  }
  return { schema, aggData };
}

export { specification, visualElements }
