type Edge = [[number, number], number];
type AdjList = Edge[];
/**
 * 
 * @param matrix adjmatrix
 */
function turnAdjMatrix2List(matrix: number[][]): AdjList {
  // only for the special matrix here(corelational matrix)
  let edges: AdjList = [];
  for (let i = 0; i < matrix.length; i++) {
    for (let j = i + 1; j < matrix[i].length; j++) {
      edges.push([[i, j], Math.abs(matrix[i][j])]);
    }
  }
  return edges
}

function find (parents: number[], n: number): number {
  return parents[n] === n ? n : parents[n] = find(parents, parents[n]);
}


function union (parents: number[], n1: number, n2: number): void {
  let p1 = find(parents, n1);
  let p2 = find(parents, n2);
  parents[p1] = p2;
  // I'm too tired. this is just a tmp lazy solution.... will be fixed later.
  // may check and prove whether it's necessary.
  find(parents, n1);
  find(parents, n2)
}

// maxiumn spanning tree
interface KruskalClusterProps {
  /**
   * adjmaxtrix
   */
  matrix: number[][];
  /**
   * number of groups of measures
   */
  groupMaxSize: number
}
function kruskal({ matrix, groupMaxSize }: KruskalClusterProps): Map<number, number[]> {
  const edges = turnAdjMatrix2List(matrix);
  edges.sort((a, b) => b[1] - a[1]);
  const parents = matrix.map((m, i) => i);
  
  for (let edge of edges) {
    if (find(parents, edge[0][0]) !== find(parents, edge[0][1])) {
      union(parents, edge[0][0], edge[0][1]);
    }
    for (let i = 0; i < parents.length; i++) {
      parents[i] = find(parents, i)
    }
    let set = new Set(parents);
    if (set.size <= groupMaxSize){
      break;
    }
  }
  let groups: Map<number, number[]> = new Map();
  for (let i = 0; i < parents.length; i++) {
    if (!groups.has(parents[i])) {
      groups.set(parents[i], []);
    }
    groups.get(parents[i]).push(i);
  }
  return groups;
}

function kruskalMST(matrix: number[][]) {
  const edges = turnAdjMatrix2List(matrix);
  edges.sort((a, b) => b[1] - a[1]);

  const edgesInMST: AdjList = []
  const parents = matrix.map((m, i) => i);
  for (let edge of edges) {
    if (find(parents, edge[0][0]) !== find(parents, edge[0][1])) {
      union(parents, edge[0][0], edge[0][1]);
      edgesInMST.push(edge);
    }
    for (let i = 0; i < parents.length; i++) {
      parents[i] = find(parents, i)
    }
    let set = new Set(parents);
    // TODO:
    // + use kruskalMST instead of kruskal.
    // + add param: maxGroupSize
    if (set.size <= 4){
      break;
    }
  }
  return { edgesInMST, groups: parents }
}

interface ClusterProps {
  matrix: number[][];
  measures: string[];
  method?: string;
  groupMaxSize?: number;
}
function cluster ({ matrix, measures ,method = 'kruskal', groupMaxSize = 4 }: ClusterProps): string[][] {
  const groups = kruskal({ matrix, groupMaxSize });
  let ans: string[][] = [];
  for (let meas of groups.values()) {
    ans.push(meas.map(meaIndex => measures[meaIndex]))
  }
  return ans;
}

export default cluster;

export { kruskalMST }