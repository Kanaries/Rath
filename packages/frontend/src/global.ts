export type Aggregator = 'sum' | 'mean' | 'count';
export type FieldType = 'quantitative' | 'nominal' | 'ordinal' | 'temporal';
export interface Field {
  name: string;
  type: FieldType
}

export interface Record {
  [key: string]: any
}

export type DataSource = Record[];

// export Impurity
export type BIFieldType = 'dimension' | 'measure';

export interface BIField {
  name: string;
  type: 'dimension' | 'measure'
}

export type FieldImpurity = [string, number, number, Field];

export type OperatorType = 'sum' | 'mean' | 'count';