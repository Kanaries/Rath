import { RequestHandler } from 'express';
import { UnivariateSummary } from 'visual-insights';
const { getAllFieldsDistribution, getAllFieldTypes, getAllFieldsEntropy } = UnivariateSummary;

interface RequestBody {
  fields: string[];
  dataSource: Array<{[key: string]: any}>
}

const fieldSummary: RequestHandler = (req, res) => {
  const { fields, dataSource } = req.body as RequestBody;
  try {
    const fieldDistributionList = getAllFieldsDistribution(dataSource, fields);
    const fieldTypeList = getAllFieldTypes(dataSource, fields);
    const fieldEntropyList = getAllFieldsEntropy(dataSource, fields);
    res.json({
      success: true,
      data: fieldDistributionList.map((field, index) => {
        return {
          ...field,
          ...fieldEntropyList[index],
          type: fieldTypeList[index].type
        }
      })
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.toString()
    })
  }
}

export default fieldSummary;