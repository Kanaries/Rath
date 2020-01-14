// import { aggregate } from '../utils';
import aggregate from 'cube-core';
import { entropy, normalize } from '../impurityMeasure';
import { DataSource, OperatorType } from '../commonTypes';
import { crammersV } from '../dashboard/utils';
import { CrammersVThreshold } from './config';
import cluster from './cluster';
// insights like outlier and trend both request high impurity of dimension.
const maxVisualChannel = 8;
function getCombination(elements: string[], start: number = 1, end: number = elements.length): string[][] {
  let ans: string[][] = [];
  const combine = (step: number, set: string[], size: number) => {
    if (set.length === size) {
      ans.push([...set]);
      return;
    }
    if (step >= elements.length) {
      return;
    }
    combine(step + 1, [...set, elements[step]], size);
    combine(step + 1, set, size);
  }
  for (let i = start; i <= Math.min(end, maxVisualChannel); i++) {
    combine(0, [], i);
  }
  return ans
}
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
  console.log(dimCorrelationMatrix)
  // groupMaxSize here means group number.
  let groups: string[][] = cluster({
    matrix: dimCorrelationMatrix,
    measures: dimensions,
    groupMaxSize: Math.round(dimensions.length / maxDimNumberInView),
    threshold: CrammersVThreshold
  });
  // todo: maybe a threhold would be better ?
  for (let group of groups) {
    let combineDimSet: string[][] = getCombination(group);
    dimSets.push(...combineDimSet);
  }
  return dimSets;
}

export function linearMapPositive (arr: number[]): number[] {
  let min = Math.min(...arr);
  return arr.map(a => a - min + 1);
}

function sum(arr: number[]): number {
  let sum = 0;
  for (let i = 0, len = arr.length; i < len; i++) {
    // if (typeof dataSource[i][field])
    sum += arr[i];
  }
  return sum;
}

export function correlation(dataSource: DataSource, fieldX: string, fieldY: string): number {
  let r = 0;
  let xBar = sum(dataSource.map(r => r[fieldX])) / dataSource.length;
  let yBar = sum(dataSource.map(r => r[fieldY])) / dataSource.length;
  r = sum(dataSource.map(r => (r[fieldX] - xBar) * (r[fieldY] - yBar))) /
  Math.sqrt(sum(dataSource.map(r => Math.pow(r[fieldX] - xBar, 2))) * sum(dataSource.map(r => Math.pow(r[fieldY] - yBar, 2))));
  return r;
}
export type FieldsFeature = [string[], any, number[][]];
function analysisDimensions(dataSource: DataSource, dimensions: string[], measures: string[], operator: OperatorType | undefined = 'sum'): FieldsFeature[] {
  let impurityList: FieldsFeature[] = [];
  let dimSet = getDimSetsBasedOnClusterGroups(dataSource, dimensions);
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
          let r = correlation(aggData, measures[i], measures[j]);
          correlationMatrix[j][i] = correlationMatrix[i][j] = r;
        }
      }
    impurityList.push([dset, impurity, correlationMatrix]);
  }
  return impurityList
}

export { analysisDimensions, getCombination }