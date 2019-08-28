import {
  deepcopy,
  memberCount,
  groupCategoryField,
  groupContinousField,
  aggregate,
  isFieldCategory,
  isFieldContinous
} from './utils';

function fieldsAnalysis(rawData, dimensions, measures) {
  // 1. process fields
  // 2. aggregate
  // 3. calculate field entropy
  // 4. give the high entropy fields with high delta I aesthics 

  let dataSource = deepcopy(rawData);
  for (let dim of dimensions) {
    if (isFieldContinous(dataSource, dim)) {
      dataSource = groupContinousField({
        dataSource,
        field: dim,
        newField: `${dim}(group)`,
        groupNumber: 6
      });
    } else if (isFieldCategory(dataSource, dim)) {
      console.log('todo')
      // const members = memberCount(dataSource, dim);
      // if (members.length > 10) {
      //   dataSource = groupCategoryField({
          
      //   })
      // }
    }
  }
  

}