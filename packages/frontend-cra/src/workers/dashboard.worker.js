/* eslint no-restricted-globals: 0 */
import { DashBoard } from 'visual-insights';
import { timer } from './timer';

function transSubspaces2FieldsFeature(subspaces) {
  let fieldFeatureList = [];
  for (let subspace of subspaces) {
    let measureScore = {};
    subspace.measures.forEach(mea => {
      measureScore[mea.name] = mea.value;
    })
    fieldFeatureList.push([
      subspace.dimensions,
      measureScore,
      subspace.correlationMatrix
    ])
  }
  return fieldFeatureList;
}
const generateDashBoard = (e) => {
  const { dataSource, dimensions, measures, subspaces } = e.data;
  try {
    const fieldFeatureList = transSubspaces2FieldsFeature(subspaces);
    const dashBoardSubspaces = DashBoard.getDashBoardSubspace(dataSource, dimensions, measures, fieldFeatureList);
    const dashBoardViewList = [];

    for (let i = 0; i < dashBoardSubspaces.length; i++) {
      const viewsInDashBoard = DashBoard.getDashBoardView(dashBoardSubspaces[i], dataSource);
      viewsInDashBoard.sort((a, b) => {
        if (a.type === 'feature' && b.type === 'target') return 1;
        return a.measures.length - b.measures.length; 
      })
      dashBoardViewList.push(viewsInDashBoard);
    }
    self.postMessage({
      success: true,
      data: dashBoardViewList
    })
  } catch (error) {
    self.postMessage({
      success: false,
      message: error
    })
  }
}

self.addEventListener('message', timer(generateDashBoard), false);