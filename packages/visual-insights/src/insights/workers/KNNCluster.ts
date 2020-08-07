import { InsightWorker } from '../../commonTypes'
import { GroupIntention } from '../intention/groups'

export const KNNClusterWorker: InsightWorker = async (aggData, dimensions, measures) => {
  if (dimensions.length < 2) return null
  let sig = 0
  let groupIntention = new GroupIntention({
    dataSource: aggData,
    dimensions,
    measures,
    K: 8,
  })
  sig = groupIntention.getSignificance(measures.concat(dimensions.slice(0, -1)), dimensions.slice(-1))
  return {
    dimensions,
    measures,
    significance: sig,
  }
}
