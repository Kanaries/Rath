# Show Me

![](https://www.travis-ci.org/ObservedObserver/showme.svg?branch=master)
![](https://img.shields.io/github/license/ObservedObserver/showme)

A implementation of tableau showme feature. Not completely follow the tableau's rules.

## Introduction

showme helps you group the fields with too many members(both category and continous) except those obey uniform distribution and then ranks the new fields by their impurity measure (entropy as default).

```bash
0 - fields
1 - entropy / impurity
2 - largest entropy log(category) / max(impurity)
┌─────────┬───────────────────┬────────────────────┬───────────────────┐
│ (index) │         0         │         1          │         2         │
├─────────┼───────────────────┼────────────────────┼───────────────────┤
│    0    │       'Sex'       │ 0.9983320412729848 │         1         │
│    1    │ 'Survived(group)' │ 0.9999333063390999 │         1         │
│    2    │    'Embarked'     │ 1.4040564841946588 │         2         │
│    3    │     'Pclass'      │ 1.554059251795564  │ 1.584962500721156 │
│    4    │  'Parch(group)'   │ 1.799076550749284  │ 2.584962500721156 │
│    5    │   'Age(group)'    │ 2.3911297628989137 │ 2.584962500721156 │
│    6    │      'Count'      │ 2.822952399757021  │ 4.392317422778761 │
└─────────┴───────────────────┴────────────────────┴───────────────────┘
```
Then, the showme will match each field with a proper visual element based on the impurity *(Tan, et al, 2011, Introduction to Data Mining)* of the field and the sensation of aestheics *(Wilkinson, 2005, The Grammar of Graphics)* .
```js
{
  position: [ 'Count', 'Age(group)' ],
  'adjust&color': [ 'Parch(group)' ],
  facets: [ 'Pclass', 'Embarked' ],
  size: [ 'Survived(group)' ],
  opacity: [ 'Sex' ],
  geomType: [ 'interval' ]
}
```
## Usage
you can choose:
+ Use algorithm library only.
+ Use UI components based on charts library (vega-lite/g2)

If you just want to use the algorithm instead of the ui component, you can use the source code in `/lib`. Currently run `npm run build` will use rollup to pack all the code in the lib instead of the ui part in `src`.

### API

#### specification(dataSource, dimensions, measures): schema
+ dataSource: `Array<{ [key: string]: string | number | null }>` json style format dataset.
+ dimensions: `string[]` collections of keys which are independent variables.
+ measures: `string[]` collections of keys which are dependent variables.

return a chart specification schema, example:
```js
{
  position: [ 'Count', 'Age(group)' ],
  'adjust&color': [ 'Parch(group)' ],
  facets: [ 'Pclass', 'Embarked' ],
  size: [ 'Survived(group)' ],
  opacity: [ 'Sex' ],
  geomType: [ 'interval' ]
}
```
You can use this schema to generate visual chart with any visualization library you prefer.

#### fieldsAnalysis(rawData, dimensions, measures): dimScores
+ rawData: `Array<{ [key: string]: string | number | null }>` json style format dataset.
+ dimensions: `string[]` collections of keys which are independent variables.
+ measures: `string[]` collections of keys which are dependent variables.

return dimension score list: `Array<[dimension, impurity, maxImpurity]>`
```js
[
  [ 'Ticket(group)', 0.31438663168300657, 2.584962500721156 ],
  [ 'Fare(group)', 0.47805966268354355, 2.321928094887362 ],
  [ 'SibSp(group)', 0.5668299600894294, 2.321928094887362 ],
  [ 'Cabin(group)', 0.8964522768552765, 2.584962500721156 ],
  [ 'Sex', 0.9362046432498521, 1 ],
  [ 'Survived(group)', 0.9607079018756469, 1 ],
  [ 'Embarked', 1.117393450740606, 2 ],
  [ 'Parch(group)', 1.1239601233166567, 2.584962500721156 ],
  [ 'Pclass', 1.4393214704441286, 1.584962500721156 ],
  [ 'Age(group)', 2.1763926737318022, 2.584962500721156 ],
  [ 'Name', 9.79928162152199, 9.799281621521923 ],
  [ 'PassengerId', 9.79928162152199, 9.799281621521923 ]
]
```

#### isFieldCategory(dataSource, field): boolean
+ dataSource: `Array<{ [key: string]: string | number | null }>` json style format dataset.
+ field: `string`

#### isFieldContinous(dataSource, field): boolean
+ dataSource: `Array<{ [key: string]: string | number | null }>` json style format dataset.
+ field: `string`

#### aggregate({ dataSource, fields, bys, method = 'sum' }): aggregated dataSource
+ dataSource: `Array<{ [key: string]: string | number | null }>` json style format dataset.
+ field: `string[]`. usually known as dimensions.
+ bys: `string[]`. usually known as measures.

return aggregated dataSource, which for the `index` key is the unique key for each record.
```typescript
Array<{
  [key: string]: string | number | null;
  index: string
}>
```

example:
```js
aggregate({
  dataSource: [...],
  fields: [ 'Sex', 'Pclass' ],
  bys: [ 'Count' ],
  method: 'sum'
})

// returns.
[
  { index: '["male","3"]', Count: 347, Sex: 'male', Pclass: '3' },
  { index: '["female","1"]', Count: 94, Sex: 'female', Pclass: '1' },
  { index: '["female","3"]', Count: 144, Sex: 'female', Pclass: '3' },
  { index: '["male","1"]', Count: 122, Sex: 'male', Pclass: '1' },
  { index: '["female","2"]', Count: 76, Sex: 'female', Pclass: '2' },
  { index: '["male","2"]', Count: 108, Sex: 'male', Pclass: '2' }
]
```

#### memberCount(dataSource, field): Array<[memberName, count]>
+ dataSource: `Array<{ [key: string]: string | number | null }>` json style format dataset.
+ field: `string`

example:
```js
memberCount(dataSource, 'Sex')
// returns
[ [ 'male', 577 ], [ 'female', 314 ] ]
```

#### groupContinousField({ dataSource, field, newField, groupNumber })
+ dataSource: `Array<{ [key: string]: string | number | null }>` json style format dataset.
+ field: `string`
+ newField: `string`
+ groupNumber: number (no less than 1)

example of field 'Age':
```js
// ungrouped
[
  [ 22, 27 ],  [ 38, 11 ],  [ 26, 18 ],  [ 35, 18 ],  [ 0, 177 ],
  [ 54, 8 ],   [ 2, 10 ],   [ 27, 18 ],  [ 14, 6 ],   [ 4, 10 ],
  [ 58, 5 ],   [ 20, 15 ],  [ 39, 14 ],  [ 55, 2 ],   [ 31, 17 ],
  [ 34, 15 ],  [ 15, 5 ],   [ 28, 25 ],  [ 8, 4 ],    [ 19, 25 ],
  [ 40, 13 ],  [ 66, 1 ],   [ 42, 13 ],  [ 21, 24 ],  [ 18, 26 ],
  [ 3, 6 ],    [ 7, 3 ],    [ 49, 6 ],   [ 29, 20 ],  [ 65, 3 ],
  [ 28.5, 2 ], [ 5, 4 ],    [ 11, 4 ],   [ 45, 12 ],  [ 17, 13 ],
  [ 32, 18 ],  [ 16, 17 ],  [ 25, 23 ],  [ 0.83, 2 ], [ 30, 25 ],
  [ 33, 15 ],  [ 23, 15 ],  [ 24, 30 ],  [ 46, 3 ],   [ 59, 2 ],
  [ 71, 2 ],   [ 37, 6 ],   [ 47, 9 ],   [ 14.5, 1 ], [ 70.5, 1 ],
  [ 32.5, 2 ], [ 12, 1 ],   [ 9, 8 ],    [ 36.5, 1 ], [ 51, 7 ],
  [ 55.5, 1 ], [ 40.5, 2 ], [ 44, 9 ],   [ 1, 7 ],    [ 61, 3 ],
  [ 56, 4 ],   [ 50, 10 ],  [ 36, 22 ],  [ 45.5, 2 ], [ 20.5, 1 ],
  [ 62, 4 ],   [ 41, 6 ],   [ 52, 6 ],   [ 63, 2 ],   [ 23.5, 1 ],
  [ 0.92, 1 ], [ 43, 5 ],   [ 60, 4 ],   [ 10, 2 ],   [ 64, 2 ],
  [ 13, 2 ],   [ 48, 9 ],   [ 0.75, 2 ], [ 53, 1 ],   [ 57, 2 ],
  [ 80, 1 ],   [ 70, 2 ],   [ 24.5, 1 ], [ 6, 3 ],    [ 0.67, 1 ],
  [ 30.5, 2 ], [ 0.42, 1 ], [ 34.5, 1 ], [ 74, 1 ]
]
// grouped with a group number = 6
[
  [ '[13.333333333333334, 26.666666666666668)', 248 ],
  [ '[26.666666666666668, 40)', 232 ],
  [ '[-Infinity, 13.333333333333334)', 248 ],
  [ '[53.333333333333336, 66.66666666666667)', 43 ],
  [ '[40, 53.333333333333336)', 113 ],
  [ '[66.66666666666667, Infinity)', 7 ]
]
```

#### groupCategoryField({ dataSource, field, newField, groupNumber })
+ dataSource: `Array<{ [key: string]: string | number | null }>` json style format dataset.
+ field: `string`
+ newField: `string`
+ groupNumber: number (no less than 1)

example of field 'Parch':
```js
// ungrouped
[
  [ 0, 678 ],
  [ 1, 118 ],
  [ 2, 80 ],
  [ 5, 5 ],
  [ 3, 5 ],
  [ 4, 4 ],
  [ 6, 1 ]
]

// grouped
[ [ 0, 678 ], [ 1, 118 ], [ 2, 80 ], [ 'others', 15 ] ]
```
#### normalize(frequencyList: number[]): number[]
```js
frequencyList => probabilityList
```

#### isUniformDistribution(dataSource, field): boolean
+ dataSource: `Array<{ [key: string]: string | number | null }>` json style format dataset.
+ field: `string`

### Impurity Measures

+ entropy(probabilityList: number[]): number
+ gini(probabilityList: number[]): number

## Test

Most of the test are based on kaggle open dataset, like titanic. Dataset could be found in `/test/dataset`.

## Todos

### Todo List
+ [ ] `groupCategoryField` should help user to build new distribution obey power law distribution. (It means the 'others' member's count should less than any other fields here.)

### Interface for React Components (todos)
```typescript
interface iView {
  dimensions: Array<Field>;
  measures: Array<Field>;
  dataSource: Array<Row>;
}
// {dimensions, measures} is a subset of fields in dataSource.

interface oView {
	facets?: Array<Field>;
  rows: Array<Field>;
  columns: Array<Field>;
  x: [Field | null];
  y: [Field | null];
  geom: GeomType[];
  color: [Field | null];
  opacity: [Field | null];
  size: [Field | null];
  shape: [Field | null];
  coordinate?: string;
}

type showme(dataView) = Array<[oView, number]>
```