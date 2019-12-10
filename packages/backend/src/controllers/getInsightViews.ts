import { RequestHandler } from 'express';
import { getInsightViews } from 'visual-insights';
interface RequestBody {
  dataSource: Array<{[key: string]: any}>;
  dimensions: string[];
  measures: string[];
}
const insightViews: RequestHandler = (req, res) => {
  console.log('[getInsightViews]')
  try {
    const { dataSource, dimensions, measures } = req.body as RequestBody;
    const result = getInsightViews(dataSource, dimensions, measures);
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.toString()
    })
  }
}

export default insightViews;