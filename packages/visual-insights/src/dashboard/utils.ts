import { DataSource } from "../commonTypes";

export function chiSquared(matrix: number[][] = [[]]): number {
  let rowSums = matrix.map(m => 0);
  let colSums = matrix[0].map(m => 0);
  let totalSum = 0;
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      rowSums[i] += matrix[i][j];
      colSums[j] += matrix[i][j];
      totalSum += matrix[i][j];
    }
  }
  let chis = 0;
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      let observed = matrix[i][j];
      let expected = rowSums[i] * colSums[j] / totalSum;
      chis += (observed - expected) ** 2 / expected;
    }
  }
  return chis;
}

export function crammersV(dataSource: DataSource, fieldX: string, fieldY: string): number {
  const xSet = new Set(dataSource.map(d => d[fieldX]))
  const ySet = new Set(dataSource.map(d => d[fieldY]))
  const xMembers = [...xSet];
  const yMembers = [...ySet];
  let xDict = {};
  let yDict = {};
  for (let i = 0; i < xMembers.length; i++) {
    xDict[xMembers[i]] = i;
  }
  for (let i = 0; i < yMembers.length; i++) {
    yDict[yMembers[i]] = i;
  }
  // let matrix: number[][] = xMembers.map(x => yMembers.map(y => 0));
  let matrix: number[][] = [];
  for (let  i = 0; i < xMembers.length; i++) {
    matrix.push([]);
    for (let j = 0; j < yMembers.length; j++) {
      matrix[i].push(0);
    }
  }
  for (let record of dataSource) {
    matrix[xDict[record[fieldX]]][yDict[record[fieldY]]]++;
  }
  const chis = chiSquared(matrix);
  const V = Math.sqrt(chis / (dataSource.length * Math.min(xMembers.length - 1, yMembers.length - 1)))
  return V;
}