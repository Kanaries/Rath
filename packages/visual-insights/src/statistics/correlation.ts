import { Record } from "../commonTypes";
type NestTree = Map<string, Map<string, number>>;
/**
 * correlation coefficient function. returns a value in range [0, 1].
 */
export type CorrelationCoefficient = (dataSource: Record[], fieldX: string, fieldY: string) => number
/**
 * chiSquared implementation using adjacency list(spare graph), which is ableto handle fields with large cardinality.
 * @param nestTree hash tree with depth = 2, represents the relationship between var x and var y.
 * @param xSet value set of var x.
 * @param ySet value set of var y.
 */
export function chiSquared(nestTree: NestTree, xSet: Set<string>, ySet: Set<string>): number {
  if (typeof nestTree === 'undefined' || typeof xSet === 'undefined' || typeof ySet === 'undefined') {
    return 0;
  }
  let rowSums = new Map<string, number>();
  let colSums = new Map<string, number>();
  let totalSum = 0;
  for (let x of xSet) {
    rowSums.set(x, 0);
  }
  for (let y of ySet) {
    colSums.set(y, 0);
  }
  for (let [x, node] of nestTree) {
    for (let [y, counter] of node) {
      rowSums.set(x, rowSums.get(x) + counter);
      colSums.set(y, colSums.get(y) + counter);
      totalSum += counter;
    }
  }

  let chis = 0;
  for (let [x, node] of nestTree) {
    for (let [y, observed] of node) {
      let expected = rowSums.get(x) * colSums.get(y) / totalSum;
      chis += (observed - expected) ** 2 / expected;
    }
  }
  return chis;
}

/**
 * crammersV implementation using adjacency list(spare graph), which is ableto handle fields with large cardinality.
 * @param dataSource array of records.
 * @param fieldX field key of var X.
 * @param fieldY field key of varY.
 */
export const crammersV: CorrelationCoefficient = (dataSource, fieldX, fieldY) => {
  const xSet = new Set<string>()
  const ySet = new Set<string>()
  const nestTree = new Map<string, Map<string, number>>();
  let len = dataSource.length;
  for (let i = 0; i < len; i++) {
    let record = dataSource[i];
    xSet.add(record[fieldX])
    ySet.add(record[fieldY]);
    if (!nestTree.has(record[fieldX])) {
      nestTree.set(record[fieldX], new Map());
    }
    let node = nestTree.get(record[fieldX]);
    if (!node.has(record[fieldY])) {
      node.set(record[fieldY], 0);
    }
    node.set(record[fieldY], node.get(record[fieldY]) + 1);
  }
  const chis = chiSquared(nestTree, xSet, ySet);
  const V = Math.sqrt(chis / (dataSource.length * Math.min(xSet.size - 1, ySet.size - 1)))
  return V;
}
/**
 * Pearson correlation coefficient
 * @param dataSource array of records
 * @param fieldX field key of var X.
 * @param fieldY field key of var Y.
 */
export const pearsonCC: CorrelationCoefficient = (dataSource, fieldX, fieldY) => {
  let r = 0;
  let xBar = sum(dataSource.map(row => row[fieldX])) / dataSource.length;
  let yBar = sum(dataSource.map(row => row[fieldY])) / dataSource.length;
  r = sum(dataSource.map(row => (row[fieldX] - xBar) * (row[fieldY] - yBar))) /
  Math.sqrt(sum(dataSource.map(row => Math.pow(row[fieldX] - xBar, 2))) * sum(dataSource.map(row => Math.pow(row[fieldY] - yBar, 2))));
  return r;
}

function sum(arr: number[]): number {
  let s = 0;
  for (let i = 0, len = arr.length; i < len; i++) {
    // if (typeof dataSource[i][field])
    s += arr[i];
  }
  return s;
}


// can be used for test. do not delete these code. it is implementation with adj matrix. can be faster in dense graph cases.
// export function crammersV(dataSource: DataSource, fieldX: string, fieldY: string): number {
//   const xSet = new Set(dataSource.map(d => d[fieldX]))
//   const ySet = new Set(dataSource.map(d => d[fieldY]))
//   const xMembers = [...xSet];
//   const yMembers = [...ySet];
//   let xDict = {};
//   let yDict = {};
//   for (let i = 0; i < xMembers.length; i++) {
//     xDict[xMembers[i]] = i;
//   }
//   for (let i = 0; i < yMembers.length; i++) {
//     yDict[yMembers[i]] = i;
//   }
//   // let matrix: number[][] = xMembers.map(x => yMembers.map(y => 0));
//   let matrix: number[][] = [];
//   for (let  i = 0; i < xMembers.length; i++) {
//     matrix.push([]);
//     for (let j = 0; j < yMembers.length; j++) {
//       matrix[i].push(0);
//     }
//   }
//   for (let record of dataSource) {
//     matrix[xDict[record[fieldX]]][yDict[record[fieldY]]]++;
//   }
//   const chis = chiSquared(matrix);
//   const V = Math.sqrt(chis / (dataSource.length * Math.min(xMembers.length - 1, yMembers.length - 1)))
//   return V;
// }

// export function chiSquared(matrix: number[][] = [[]]): number {
//   let rowSums = matrix.map(m => 0);
//   let colSums = matrix[0].map(m => 0);
//   let totalSum = 0;
//   for (let i = 0; i < matrix.length; i++) {
//     for (let j = 0; j < matrix[i].length; j++) {
//       rowSums[i] += matrix[i][j];
//       colSums[j] += matrix[i][j];
//       totalSum += matrix[i][j];
//     }
//   }
//   let chis = 0;
//   for (let i = 0; i < matrix.length; i++) {
//     for (let j = 0; j < matrix[i].length; j++) {
//       let observed = matrix[i][j];
//       let expected = rowSums[i] * colSums[j] / totalSum;
//       chis += (observed - expected) ** 2 / expected;
//     }
//   }
//   return chis;
// }