import { RequestHandler } from 'express';
import { getInsightViews } from 'visual-insights';

const insightViews: RequestHandler = (req, res) => {
  console.log('[getInsightViews]')
  try {
    const { dataSource, dimensions, measures } = req.body;
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