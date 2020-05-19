import { DashBoard } from 'visual-insights';
import { RequestHandler } from 'express';
import { DataSource } from 'visual-insights/build/esm/commonTypes';
import { FieldsFeature } from 'visual-insights/build/esm/insights/impurity';
interface Subspace {
  score: number;
  dimensions: string[];
  measures: Array<{name: string; value: number}>;
  correlationMatrix: number[][];
}
interface DashBoardRequest {
  dataSource: DataSource;
  dimensions: string[];
  measures: string[];
  subspaces: Subspace[]
}

function transSubspaces2FieldsFeature(subspaces: Subspace[]): FieldsFeature[] {
  let fieldFeatureList: FieldsFeature[] = [];
  for (let subspace of subspaces) {
    let measureScore: any = {};
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
const generateDashBoard: RequestHandler = (req, res) => {
  const { dataSource, dimensions, measures, subspaces } = req.body as DashBoardRequest;
  try {
    const fieldFeatureList = transSubspaces2FieldsFeature(subspaces);
    const dashBoardSubspaces = DashBoard.getDashBoardSubspace(dataSource, dimensions, measures, fieldFeatureList);
    const dashBoardViewList = [] // DashBoard.getDashBoardView(dashBoardSubspaces);

    for (let i = 0; i < dashBoardSubspaces.length; i++) {
      const viewsInDashBoard = DashBoard.getDashBoardView(dashBoardSubspaces[i], dataSource);
      viewsInDashBoard.sort((a, b) => {
        if (a.type === 'feature' && b.type === 'target') return 1;
        return a.measures.length - b.measures.length; 
      })
      dashBoardViewList.push(viewsInDashBoard);
    }
    res.json({
      success: true,
      data: dashBoardViewList
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error
    })
  }
}

export default generateDashBoard;
