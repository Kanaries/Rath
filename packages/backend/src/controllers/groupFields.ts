import { RequestHandler } from 'express';
import { UnivariateSummary } from 'visual-insights';

const groupFields: RequestHandler = (req, res) => {
  console.log('[getgroupFields]')
  const { dataSource, fields } = req.body;
  const result = UnivariateSummary.groupFields(dataSource, fields);
  res.json({
    success: true,
    data: result
  })
}

export default groupFields;