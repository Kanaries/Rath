import { fieldsAnalysis, getInsightViews } from 'visual-insights'
import { RequestHandler } from 'express';

const fieldProcess: RequestHandler = (req, res) => {
  console.log('[fieldsAnalysis]')
  const { dataSource, dimensions, measures } = req.body;
  const { dimScores, aggData, mapData } = fieldsAnalysis(dataSource, dimensions, measures);
  res.json({
    success: true,
    data: {
      dimScores, aggData, mapData
    }
  })
}

export default fieldProcess;