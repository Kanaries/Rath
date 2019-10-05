import { RequestHandler } from 'express';
import { UnivariateSummary } from 'visual-insights';
import { FieldType } from 'visual-insights/build/esm/commonTypes';
const { getAllFieldsDistribution, getAllFieldTypes, getAllFieldsEntropy } = UnivariateSummary;
interface Field {
  name: string;
  type: FieldType
}
interface RequestBody {
  fields: string[] | Field[];// | Field[];
  dataSource: Array<{[key: string]: any}>
}

const fieldSummary: RequestHandler = (req, res) => {
  const { fields, dataSource } = req.body as RequestBody;
  // const fieldNames: string[] = fields.map(field => {
  //   if (typeof field === 'string') return field;
  //   return field.name as FieldType;
  // })
  let fieldNames: string[] = []
  for (let i = 0; i < fields.length; i++) {
    if (typeof fields[i] === 'string') {
      fieldNames.push(fields[i] as string)
    } else {
      fieldNames.push((fields[i] as Field).name)
    }
  }
  try {
    const fieldDistributionList = getAllFieldsDistribution(dataSource, fieldNames);
    const fieldTypeList = getAllFieldTypes(dataSource, fieldNames).map((f, i) => {
      return { ...f, type: typeof fields[i] === 'string' ? f.type : (fields[i] as Field).type }
    });
    const fieldEntropyList = getAllFieldsEntropy(dataSource, fieldNames);
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