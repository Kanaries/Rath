import { Record } from '../../commonTypes'
import { crammersV, pearsonCC, CorrelationCoefficient } from '../../statistics'

export class DataGraph {
  /**
   * dimension graph(adjmatrix)
   */
  public DG: number[][]
  /**
   * measure graph(adjmatrix)
   */
  public MG: number[][]
  public constructor(dataSource: Record[], dimensions: string[], measures: string[]) {
    this.computeDGraph(dataSource, dimensions)
    this.computeMGraph(dataSource, measures)
  }
  private computeGraph(dataSource: Record[], fields: string[], cc: CorrelationCoefficient): number[][] {
    let matrix: number[][] = fields.map((f) => fields.map(() => 0))
    for (let i = 0; i < fields.length; i++) {
      matrix[i][i] = 1
      for (let j = i + 1; j < fields.length; j++) {
        matrix[i][j] = matrix[j][i] = cc(dataSource, fields[i], fields[j])
      }
    }
    return matrix
  }
  public computeDGraph(dataSource: Record[], dimensions: string[], cc: CorrelationCoefficient = crammersV): number[][] {
    this.DG = this.computeGraph(dataSource, dimensions, cc)
    return this.DG
  }
  public computeMGraph(dataSource: Record[], measures: string[], cc: CorrelationCoefficient = pearsonCC): number[][] {
    this.MG = this.computeMGraph(dataSource, measures, cc)
    return this.MG
  }
}
