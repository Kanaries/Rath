import { FieldsFeature, correlation, linearMapPositive } from "../insights/impurity";
import { DataSource, OperatorType } from "../commonTypes";
import cluster, { kruskalMST } from "../insights/cluster";
import aggregate from 'cube-core';
import { normalize, entropy } from "../impurityMeasure";

interface DashBoardSpace {
  dimensions: string[];
  measures: string[];
  entropyMatrix: number[][];
  correlationMatrix: number[][];
}

export function getEntropyMatrix (dimensions: string[], measures: string[], dataSource: DataSource, operator?: OperatorType | undefined): number[][] {
  let matrix: number[][] = [];
  for (let i = 0; i < dimensions.length; i++) {
    let dim = dimensions[i];
    matrix.push([])
    const aggData = aggregate({
      dataSource,
      dimensions: [dim],
      measures,
      asFields: measures,
      operator: operator || 'sum'
    })
    for (let mea of measures) {
      let fL = aggData.map(r => r[mea]);
      let pL = normalize(linearMapPositive(fL));
      let value = entropy(pL);
      matrix[i].push(value)
    }
  }
  return matrix
}

export function getDashBoardSubspace (dataSource: DataSource, dimensions: string[], measures: string[], fieldFeatureList: FieldsFeature[]): DashBoardSpace[] {
  let correlationMatrix = measures.map(i => measures.map(j => 0));
  for (let i = 0; i < measures.length; i++) {
    correlationMatrix[i][i] = 1;
    for (let j = i + 1; j < measures.length; j++) {
      let r = correlation(dataSource, measures[i], measures[j]);
      correlationMatrix[j][i] = correlationMatrix[i][j] = r;
    }
  }
  const measureGroups = cluster({
    matrix: correlationMatrix,
    measures,
    groupMaxSize: 6
  })
  let dimensionsInDashBoardSet = new Set<string>();
  for (let fieldFeature of fieldFeatureList) {
    for (let dim of fieldFeature[0]) {
      dimensionsInDashBoardSet.add(dim)
    }
  }
  let dimensionsInDashBoard = [...dimensionsInDashBoardSet]
  const dashBoardSpaces: DashBoardSpace[] = [];
  for (let group of measureGroups) {
    let matrix = group.map(g => group.map(p => 0));
    for (let i = 0; i < group.length; i++) {
      let mea1Index = group.indexOf(group[i])
      for (let j = 0; j < group.length; j++) {
        let mea2Index = group.indexOf(group[j])
        matrix[i][j] = correlationMatrix[mea1Index][mea2Index];
      }
    }
    
    dashBoardSpaces.push({
      dimensions: dimensionsInDashBoard,
      measures: group,
      correlationMatrix: matrix,
      entropyMatrix: getEntropyMatrix(dimensionsInDashBoard, group, dataSource)
    })
  }
  return dashBoardSpaces;
}

interface VisView {
  type?: 'correlation' | 'impact';
  dimensions: string[];
  measures: string[];
}
/**
 * handle how to combine dim and mea to produce a chart view in dashboard
 * @param dashBoardSpace 
 * 
 */
export function getDashBoardView (dashBoardSpace: DashBoardSpace): VisView[] {
  const { dimensions, measures, entropyMatrix } = dashBoardSpace;
  /**
   * 1. get correlation view
   * 2. get impact view
   */
  const visViewList = [];
  /**
   * correlation view
   */
  const measureGroups = cluster({
    matrix: dashBoardSpace.correlationMatrix,
    measures: measures,
    groupMaxSize: 3
  });
  for (let group of measureGroups) {
    const meaIndexList = group.map(mea => measures.indexOf(mea))
    let dimScoreList = dimensions.map((dim, index) => {
      let score = 0;
      for (let meaIndex of meaIndexList) {
        score += entropyMatrix[index][meaIndex]
      }
      return score;
    });
    const dimInView = dimensions[minIndex(dimScoreList)];
    visViewList.push({
      dimensions: [dimInView],
      measures: group
    })
  }
  /**
   * impact views
   * todo: protentional repeat view or very similiar view
   */
  for (let i = 0; i < dimensions.length; i++) {
    const meaInView = measures[minIndex(entropyMatrix[i])]
    visViewList.push({
      dimensions: [dimensions[i]],
      measures: [meaInView]
    })
  }
  return visViewList
}

function minIndex(arr: number[]) {
  let i = 0;
  let len = arr.length;
  let maxValue = Infinity;
  let pos = -1;
  for (i = 0; i < len; i++) {
    if (arr[i] < maxValue) {
      maxValue = arr[i];
      pos = i;
    }
  }
  return pos;
}