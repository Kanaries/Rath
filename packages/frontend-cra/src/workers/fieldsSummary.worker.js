/* eslint no-restricted-globals: 0 */
import { UnivariateSummary } from 'visual-insights';
import { timer } from './timer';

const { getAllFieldsDistribution, getAllFieldTypes, getAllFieldsEntropy } = UnivariateSummary;

const fieldSummary = (e) => {
  const { fields, dataSource } = e.data;
  let fieldNames = []
  for (let i = 0; i < fields.length; i++) {
    if (typeof fields[i] === 'string') {
      fieldNames.push(fields[i])
    } else {
      fieldNames.push(fields[i].name)
    }
  }
  try {
    // todo:
    // should field type changed after re-group ?
    // pros: it generates a new fields. we should regard the new fields as a independent one without care about the original one's property.
    // cons: there might be a difference between nominal and ordinal field for data mining. some quantitative field become a ordinal one instead of nominal one. how to judge this case?
    // quantitative -> ordinal ? if quantitative, vis can use linear color scale or opacity, else use norminal color scale which lost info (can be fixed for ordinal in future)
    const fieldDistributionList = getAllFieldsDistribution(dataSource, fieldNames);
    const fieldTypeList = getAllFieldTypes(dataSource, fieldNames).map((f, i) => {
      return { ...f, type: typeof fields[i] === 'string' ? f.type : fields[i].type }
    });
    // const fieldTypeList = getAllFieldTypes(dataSource, fieldNames);
    const fieldEntropyList = getAllFieldsEntropy(dataSource, fieldNames);
    self.postMessage({
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
    self.postMessage({
      success: false,
      message: error.toString()
    })
  }
}

self.addEventListener('message', timer(fieldSummary), false)