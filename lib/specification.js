import fieldsAnalysis from './fieldAnalysis';
import {
  // isFieldCategory,
  // isFieldContinous,
  memberCount
} from './utils';

function getVisualElements () {
  // return [
  //   ['position', 2],
  //   ['adjust&color', 1],
  //   ['facets', 2],
  //   ['size', 1],
  //   ['shape', 1],
  //   ['opacity', 1],
  //   ['high-facets', Infinity]
  // ]
  return {
    position: 2,
    color: 1,
    size: 1,
    shape: 1,
    opacity: 1,
    facets: 2,
    page: 1,
    filter: 1,
    highFacets: Infinity
  }
}

const geomTypes = {
  interval: [0, 20],
  line: [21, Infinity],
  area: [21, Infinity],
  point: [0, 100000],
  path: [0, 100],
  density: [1001, Infinity]
}

function findBestField (type, fieldRankList) {
  for (let i = fieldRankList.length - 1; i >=0; i--) {
    if (fieldRankList[i].type === type && !fieldRankList[i].choosen) {
      return fieldRankList[i]
    }
  }
}
function aestheticMapping (dimScores) {
  let schema = {};
  let visualElements = getVisualElements();
  let fieldRankList = dimScores.map(field => {
    return {
      name: field[0],
      type: field[3].type,
      choosen: false
    }
  });
  const priority = [
    ['quantitative', ['position', 'size', 'opacity', 'color', 'page', 'filter', 'hightFacets']],
    ['ordinal', ['position', 'opacity' ,'color', 'facets', 'size', 'page', 'filter', 'highFacets']],
    ['nominal', ['position', 'color', 'facets', 'shape', 'page', 'filter', 'hightFacets']],
    ['temporal', ['position', 'page', 'filter']]
  ];
  let fieldLeft = fieldRankList.length;
  for (let typeIndex = 0; typeIndex < priority.length && fieldLeft > 0; typeIndex++) {
    let type = priority[typeIndex][0];
    let channelList = priority[typeIndex][1];
    
    for (let i = 0; i < channelList.length && fieldLeft > 0; i++) {
      let channel = channelList[i];

      let field;
      while (visualElements[channel] > 0 && (field = findBestField(type, fieldRankList))) {
        if (typeof schema[channel] === 'undefined') {
          schema[channel] = []
        }
        schema[channel].push(field.name);
        visualElements[channel]--;
        fieldLeft--;
        field.choosen = true;
      }
    }
  }
  return schema
  
  // for (let visPos = 0; visPos < visualElements.length && fieldLeft > 0; visPos++) {
  //   let positionLeft = visualElements[visPos][1];
  //   if (typeof schema[visualElements[visPos][0]] === 'undefined') {
  //     schema[visualElements[visPos][0]] = []
  //   }
  //   let queue = [];
  //   let searchPos = 0
  //   while(positionLeft > 0 && fieldLeft > 0) {
  //     let field = fieldRankList.slice(searchPos % fieldRankList.length).find(f => !f.choosen);
  //     if (field === undefined) {
  //       field = queue[0];
  //     }
  //     if (searchPos < fieldRankList.length) {
  //       if (field !== queue[0] && field.type === 'nominal' && ['position', 'opacity'].includes(visualElements[visPos][0])) {
  //         queue.push(field)
  //         // field.choosen = true
  //       } else if (field !== queue[0] && field.type === 'quantitative' && ['shape'].includes(visualElements[visPos][0])) {
  //         queue.push(field)
  //         // field.choosen = true
  //       } else if (field !== queue[0] && ['ordinal'].includes(field.type) && ['opacity'].includes(visualElements[visPos][0])) {
  //         queue.push(field)
  //         // field.choosen = true
  //       } else {
  //         schema[visualElements[visPos][0]].push(field.name)
  //         positionLeft--;
  //         fieldLeft--;
  //         field.choosen = true
  //         if (field === queue[0]) {
  //           queue.unshift();
  //         }
  //       }
  //     } else {
  //       schema[visualElements[visPos][0]].push(field.name)
  //       positionLeft--;
  //       fieldLeft--;
  //       field.choosen = true
  //       if (field === queue[0]) {
  //         queue.unshift();
  //       }
  //     }
  //     searchPos++;
  //   }
  // }
  // return schema;
}

function specificationWithFieldsAnalysisResult (dimScores, aggData, measures) {
  let viewDimensions = dimScores.map(dim => dim[0]).filter(dim => !measures.includes(dim));

  let schema = aestheticMapping(dimScores);
  // todo: design a better rule for choosing geom type.
  if (schema.position.length === 2) {
    // if ((isFieldCategory(dataSource, schema.position[0]) && isFieldCategory(dataSource, schema.position[0])) ||
    // (isFieldCategory(dataSource, schema.position[1]) && isFieldCategory(dataSource, schema.position[0]))) {
    //   schema.geomType = ['interval', 'line', 'point', 'area'];
    // } else {
    //   schema.geomType = ['line', 'point', 'area'];
    // }
    if ((viewDimensions.includes(schema.position[0]) && measures.includes(schema.position[1])) ||
      (viewDimensions.includes(schema.position[1]) && measures.includes(schema.position[0]))) {
      const dimIndex = viewDimensions.includes(schema.position[0]) ? 0 : 1;
      const dim = schema.position[dimIndex];
      const mea = schema.position[(dimIndex + 1) % 2];
      schema.position = [dim, mea];
      const dimMembers = memberCount(aggData, dim);
      schema.geomType = ['interval', 'line', 'area'].filter(geom => {
        return dimMembers.length >= geomTypes[geom][0] && dimMembers.length <= geomTypes[geom][1];
      });
      let x = dimScores.find(dim => dim[0]=== schema.position[0])[3];
      let y = dimScores.find(dim => dim[0] === schema.position[1])[3];
      if (x.type === 'nominal' || y.type === 'nominal') {
        schema.geomType = ['interval']
      }
    } else {
      // ['point', 'path', 'heatmap']
      schema.geomType = ['point', 'density'].filter(geom => {
        return aggData.length >= geomTypes[geom][0] && aggData.length <= geomTypes[geom][1];
      });
    }
  }
  return { schema, aggData };
}
function specification (dataSource, dimensions, measures) {
  const { dimScores, aggData } = fieldsAnalysis(dataSource, dimensions, measures);
  return  specificationWithFieldsAnalysisResult(dimScores, aggData, measures);

}

export default specification;
// todo delete visualElements
// only old test use visualElements array
export const visualElements = [['position', 2],
  ['adjust&color', 1],
  ['facets', 2],
  ['size', 1],
  ['shape', 1],
  ['opacity', 1],
  ['high-facets', Infinity]
]
export { specificationWithFieldsAnalysisResult }
