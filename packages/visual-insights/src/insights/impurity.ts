// import { aggregate } from '../utils';
import aggregate from 'cube-core';
import { entropy, normalize } from '../statistics/index';
import { DataSource, OperatorType } from '../commonTypes';
import { crammersV, getCombination, pearsonCC, linearMapPositive } from '../statistics/index';
import { CrammersVThreshold } from './config';
import { Cluster } from '../ml/index';
import { CHANNEL } from '../constant';
// insights like outlier and trend both request high impurity of dimension.

function getDimCorrelationMatrix(dataSource: DataSource, dimensions: string[]): number[][] {
  let matrix: number[][] = dimensions.map(d => dimensions.map(d => 0));
  for (let i = 0; i < dimensions.length; i++) {
    matrix[i][i] = 1;
    for(let j = i + 1; j < dimensions.length; j++) {
      matrix[i][j] = matrix[j][i] = crammersV(dataSource, dimensions[i], dimensions[j]);
    }
  }
  return matrix;
}

export function getDimSetsBasedOnClusterGroups(dataSource: DataSource, dimensions: string[]): string[][] {
  const maxDimNumberInView = 4;
  let dimSets: string[][] = [];
  let dimCorrelationMatrix = getDimCorrelationMatrix(dataSource, dimensions);
  // groupMaxSize here means group number.
  let groups: string[][] = Cluster.kruskal({
    matrix: dimCorrelationMatrix,
    measures: dimensions,
    groupMaxSize: Math.round(dimensions.length / maxDimNumberInView),
    threshold: CrammersVThreshold
  });
  // todo: maybe a threhold would be better ?
  for (let group of groups) {
    let combineDimSet: string[][] = getCombination(group, 1, CHANNEL.maxDimensionNumber);
    dimSets.push(...combineDimSet);
  }
  return dimSets;
}

export function subspaceSearching(dataSource: DataSource, dimensions: string[], shouldDimensionsCorrelated: boolean | undefined = true): string[][] {
  if (shouldDimensionsCorrelated) {
    return getDimSetsBasedOnClusterGroups(dataSource, dimensions);
  } else {
    return getCombination(dimensions)
  }
}

export type FieldsFeature = [string[], any, number[][]];
export function insightExtraction(dataSource: DataSource, dimensions: string[], measures: string[], operator: OperatorType | undefined = 'sum'): FieldsFeature[] {
  let impurityList: FieldsFeature[] = [];
  let dimSet = subspaceSearching(dataSource, dimensions, true);
  for (let dset of dimSet) {
    let impurity = {};
    let aggData = aggregate({
      dataSource,
      dimensions: dset,
      measures,
      asFields: measures,
      operator: operator || 'sum'//: operator as 
    });
    // let fList = aggData.map(r => r)
    for (let mea of measures) {
      // fl = frequency list, pL = probability list
      let fL = aggData.map(r => r[mea]);
      let pL = normalize(linearMapPositive(fL));
      let value = entropy(pL);
      impurity[mea] = value;
    }
    let correlationMatrix = measures.map(i => measures.map(j => 0));
      for (let i = 0; i < measures.length; i++) {
        correlationMatrix[i][i] = 1;
        for (let j = i + 1; j < measures.length; j++) {
          let r = pearsonCC(aggData, measures[i], measures[j]);
          correlationMatrix[j][i] = correlationMatrix[i][j] = r;
        }
      }
    impurityList.push([dset, impurity, correlationMatrix]);
  }
  return impurityList
}
// interface InsightSpace {
//   dimensions: string[];
//   type: 'entropy' | 'trend' | 'outlier';
//   order: 'desc' | 'asc';
//   score: {
//     [meaName: string]: number;
//   };
//   correlationMatrix: number[][];
// }
// export function multiInsightExtraction(dataSource: DataSource, dimensions: string[], measures: string[]): InsightSpace[] {
//   let impurityList: FieldsFeature[] = [];
//   let dimSet = subspaceSearching(dataSource, dimensions, true);
//   let correlationMatrix = measures.map(i => measures.map(j => 0));
//   for (let i = 0; i < measures.length; i++) {
//     correlationMatrix[i][i] = 1;
//     for (let j = i + 1; j < measures.length; j++) {
//       let r = pearsonCC(dataSource, measures[i], measures[j]);
//       correlationMatrix[j][i] = correlationMatrix[i][j] = r;
//     }
//   }
  
//   for (let dset of dimSet) {
//     let impurity = {};
//     let trend = {};
//     let outlier = {};
//     let aggData = aggregate({
//       dataSource,
//       dimensions: dset,
//       measures,
//       asFields: measures,
//       operator: operator || 'sum'//: operator as 
//     });
//     // let fList = aggData.map(r => r)
//     for (let mea of measures) {
//       // fl = frequency list, pL = probability list
//       let fL = aggData.map(r => r[mea]);
//       let pL = normalize(linearMapPositive(fL));
//       let value = entropy(pL);
//       impurity[mea] = value;
//     }
//     for (let mea of measures) {

//     }
//     impurityList.push([dset, impurity, correlationMatrix]);
//   }
//   return impurityList
// }