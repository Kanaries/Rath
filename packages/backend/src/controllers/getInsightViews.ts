import { RequestHandler } from 'express';
import { getInsightViews } from 'visual-insights';

const insightViews: RequestHandler = (req, res) => {
  console.log('[getInsightViews]')
  const { dataSource, dimensions, measures } = req.body;
  const result = getInsightViews(dataSource, dimensions, measures);
  res.json({
    success: true,
    data: result
  })
}

export default insightViews;