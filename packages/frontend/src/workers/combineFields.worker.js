/* eslint no-restricted-globals: 0 */
import { Insight } from 'visual-insights'
import { timer } from './timer';

const combineFields = (e) => {
  try {
    const { dataSource, dimensions, measures, operator, topKPercent = 1 } = e.data;
    let impurityList = Insight.insightExtraction(dataSource, dimensions, measures, operator).map(dimReport => {
      let sum = 0;
      for (let key in dimReport[1]) {
        sum += dimReport[1][key];
      }
      return {
        ...dimReport,
        score: sum
      }
    });
    impurityList.sort((a, b) => a.score - b.score);
    let end = Math.round(topKPercent * impurityList.length)
    self.postMessage({
      success: true,
      data: impurityList.slice(0, end).map(view => {
        return {
          score: view.score,
          dimensions: view[0],
          measures: measures.map(mea => {
            return {
              name: mea,
              value: view[1][mea]
            }
          }),
          correlationMatrix: view[2]
        }
      })
    })
  } catch (error) {
    self.postMessage({
      success: false,
      message: error.toString()
    })
  }
}

self.addEventListener('message', timer(combineFields), false);