import { DataSource } from '../commonTypes';
import { crammersV, getCombination, pearsonCC } from '../statistics/index';
import { CrammersVThreshold, PearsonCorrelation } from './config';
import { Cluster } from '../ml/index';
import { CHANNEL } from '../constant';
// insights like outlier and trend both request high impurity of dimension.

export function getDimCorrelationMatrix(dataSource: DataSource, dimensions: string[]): number[][] {
  let matrix: number[][] = dimensions.map(d => dimensions.map(d => 0));
  for (let i = 0; i < dimensions.length; i++) {
    matrix[i][i] = 1;
    for(let j = i + 1; j < dimensions.length; j++) {
      matrix[i][j] = matrix[j][i] = crammersV(dataSource, dimensions[i], dimensions[j]);
    }
  }
  return matrix;
}

export function getMeaCorrelationMatrix(dataSource: DataSource, measures: string[]): number[][] {
  let matrix = measures.map(i => measures.map(j => 0));
  for (let i = 0; i < measures.length; i++) {
    matrix[i][i] = 1;
    for (let j = i + 1; j < measures.length; j++) {
      let r = pearsonCC(dataSource, measures[i], measures[j]);
      matrix[j][i] = matrix[i][j] = r;
    }
  }
  return matrix;
}

export function getDimClusterGroups(
         dataSource: DataSource,
         dimensions: string[],
         threshold: number | undefined = CrammersVThreshold,
         max_number_of_group?: number
       ): string[][] {
         const maxDimNumberInView = 4;
         let dimCorrelationMatrix = getDimCorrelationMatrix(
           dataSource,
           dimensions
         );
         // groupMaxSize here means group number.
         let groups: string[][] = Cluster.kruskal({
           matrix: dimCorrelationMatrix,
           measures: dimensions,
           groupMaxSize: max_number_of_group ? max_number_of_group : Math.round(dimensions.length / maxDimNumberInView),
           threshold,
         });
         return groups;
       }

export function getDimSetsBasedOnClusterGroups(dataSource: DataSource, dimensions: string[], correlation_threshold?: number, max_dimensions_in_space?: number): string[][] {
  let dimSets: string[][] = [];
  let groups = getDimClusterGroups(dataSource, dimensions, correlation_threshold);
  for (let group of groups) {
    let combineDimSet: string[][] = getCombination(group, 1, max_dimensions_in_space ? max_dimensions_in_space : CHANNEL.maxDimensionNumber);
    dimSets.push(...combineDimSet);
  }
  return dimSets;
}

/**
 * 
 * @param dataSource 
 * @param measures 
 * @param correlation_threshold a threshold of correlation used to define min correlation value in a cluster of measure.
 * @param max_measure_in_view 
 */
export function getMeaSetsBasedOnClusterGroups(dataSource: DataSource, measures: string[], correlation_threshold?: number, max_number_of_group: number | undefined = 3): string[][] {
  const soft_max_measures_in_view = 3;
  let correlationMatrix: number[][] = getMeaCorrelationMatrix(dataSource, measures);
  let groups: string[][] = Cluster.kruskal({
    matrix: correlationMatrix,
    measures: measures,
    groupMaxSize: max_number_of_group ? max_number_of_group : Math.round(measures.length / soft_max_measures_in_view),
    threshold: correlation_threshold ? correlation_threshold : PearsonCorrelation.strong
  });
  return groups;
}

export function subspaceSearching(dataSource: DataSource, dimensions: string[], should_dimensions_correlated: boolean | undefined = true): string[][] {
  if (should_dimensions_correlated) {
    return getDimSetsBasedOnClusterGroups(dataSource, dimensions);
  } else {
    return getCombination(dimensions)
  }
}

type Edge = [number, [number, number]];
type RelatedEdge = { field: string; corValue: number };
export function getRelatedVertices(adjMatrix: number[][], vertices: string[], verticesInGraph: string[], topK?: number): RelatedEdge[] {
  let verStatus: boolean[] = vertices.map(v => verticesInGraph.includes(v));
  let edges: Edge[] = [];
  let ans: RelatedEdge[] = [];
  for (let i = 0; i < adjMatrix.length; i++) {
    // if vertex in graph, then check all the edges from this vertex
    if (verStatus[i]) {
      for (let j = 0; j < adjMatrix[i].length; j++) {
        if (!verStatus[j]) {
          edges.push([adjMatrix[i][j], [i, j]])
        }
      }
    }
  }
  edges.sort((a, b) => {
    return b[0] - a[0];
  })
  for (let i = 0; i < edges.length; i++) {
    let targetVertexIndex = edges[i][1][1];
    if (!verStatus[targetVertexIndex]) {
      verStatus[targetVertexIndex] = true;
      ans.push({
        field: vertices[targetVertexIndex],
        corValue: edges[i][0]
      })
    }
  }
  return ans.slice(0, topK ? topK : ans.length);
}