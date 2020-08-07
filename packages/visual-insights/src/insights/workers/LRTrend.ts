import { oneDLinearRegression } from '../../statistics/index'
import { InsightWorker } from '../../commonTypes'

export const LRTrendWorker: InsightWorker = async (aggData, dimensions, measures) => {
  if (dimensions.length !== 1) return null
  let orderedData = [...aggData]
  orderedData.sort((a, b) => {
    if (a[dimensions[0]] > b[dimensions[0]]) return 1
    if (a[dimensions[0]] === b[dimensions[0]]) return 0
    else return -1
  })
  let sig = 0
  for (let mea of measures) {
    let linearModel = new oneDLinearRegression(orderedData, dimensions[0], mea)
    linearModel.normalizeDimensions(dimensions)
    sig += linearModel.significance()
  }
  sig /= measures.length
  return {
    dimensions,
    measures,
    significance: sig
  }
}
