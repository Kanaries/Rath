import { analysisDimensions } from 'visual-insights'
import { RequestHandler } from 'express';
interface CombineFieldsRequest {
  dataSource: any[];
  dimensions: string[];
  measures: string[];
  operator: 'sum' | 'mean' | 'count'
}
const combineFields: RequestHandler = (req, res) => {
  console.log('[combine fields]')
  const { dataSource, dimensions, measures, operator } = req.body as CombineFieldsRequest;
  const impurityList = analysisDimensions(dataSource, dimensions, measures, operator);
  res.json({
    success: true,
    data: impurityList.map(view => {
      return {
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
}

export default combineFields;