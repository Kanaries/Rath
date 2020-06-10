import { InsightWorker } from "../../commonTypes"
import { Outier } from "../../ml"

export const IForestOutlierWorker: InsightWorker = async (aggData, dimensions, measures) => {
  let iForest = new Outier.IsolationForest([], measures, aggData)
  iForest.buildIsolationForest()
  let scoreList = iForest.estimateOutierScore()
  let maxIndex = 0
  let score = 0
  for (let i = 0; i < scoreList.length; i++) {
    if (scoreList[i] > score) {
      score = scoreList[i]
      maxIndex = i
    }
  }
  let des: { [key: string]: any } = {}
  dimensions.concat(measures).forEach((mea) => {
    des[mea] = aggData[maxIndex][mea]
  })
  return {
    dimensions,
    measures,
    significance: score,
    description: des,
  }
}
