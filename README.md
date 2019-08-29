# Show Me

![](https://www.travis-ci.org/ObservedObserver/showme.svg?branch=master)

![](https://img.shields.io/github/license/ObservedObserver/showme)

A implementation of tableau showme feature. Not completely follow the tableau's rules.

## Introduction

`fieldsAnalysis` help you group the field with too many members(both category and continous) except those obey uniform distribution and then rank the new fields by their impurity measure (entropy as default).

```bash
0 - dimension
1 - entropy
2 - largest entropy log(category)
┌─────────┬───────────────────┬─────────────────────┬───────────────────┐
│ (index) │         0         │          1          │         2         │
├─────────┼───────────────────┼─────────────────────┼───────────────────┤
│    0    │  'Ticket(group)'  │ 0.3722823231957663  │ 2.807354922057604 │
│    1    │   'Fare(group)'   │ 0.47805966268354355 │ 2.321928094887362 │
│    2    │  'SibSp(group)'   │ 0.5668299600894294  │ 2.321928094887362 │
│    3    │  'Cabin(group)'   │ 0.9213965998738236  │ 2.807354922057604 │
│    4    │       'Sex'       │ 0.9362046432498521  │         1         │
│    5    │ 'Survived(group)' │ 0.9607079018756469  │         1         │
│    6    │    'Embarked'     │  1.117393450740606  │         2         │
│    7    │  'Parch(group)'   │ 1.1283373786812922  │ 2.807354922057604 │
│    8    │     'Pclass'      │ 1.4393214704441286  │ 1.584962500721156 │
│    9    │   'Age(group)'    │ 2.1810410569529877  │ 2.807354922057604 │
│   10    │      'Name'       │  9.79928162152199   │ 9.799281621521923 │
│   11    │   'PassengerId'   │  9.79928162152199   │ 9.799281621521923 │
└─────────┴───────────────────┴─────────────────────┴───────────────────┘
```

## Usage

If you just want to use the algorithm instead of the ui component, you can use the source code in `/lib`. Currently run `npm run build` will use rollup to pack all the code in the lib instead of the ui part in `src`.

## Interface for React Components (todos)
```typescript
interface iView {
  dimensions: Array<Field>;
  measures: Array<Field>;
  dataSource: Array<Row>;
}

interface oView {
	facets?: Array<Field>;
  rows: Array<Field>;
  columns: Array<Field>;
  x: Field | null;
  y: Field | null;
  geom: GeomType;
  color: Field | null;
  opacity: Field | null;
  size: Field | null;
  shape: Field | null;
  coordinate?: string;
}

type showme(dataView) = Array<[oView, number]>
```