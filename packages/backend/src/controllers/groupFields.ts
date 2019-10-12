import { RequestHandler } from 'express';
import { UnivariateSummary } from 'visual-insights';

const groupFields: RequestHandler = (req, res) => {
  console.log('[getgroupFields]')
  try {
    const { dataSource, fields } = req.body;
    const result = UnivariateSummary.groupFields(dataSource, fields);
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.json({
      success: false,
      message: error.toString()
    })
  }
}

export default groupFields;