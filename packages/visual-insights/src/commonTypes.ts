export interface Record {
  [key: string]: any
}

export type DataSource = Record[];

export type Dimensions = string[];
export type Measures = string[];
export type FieldType = 'quantitative' | 'nominal' | 'ordinal' | 'temporal';
export interface Field {
  name: string;
  type: FieldType;
}

export type FieldImpurity = [string, number, number, Field];
export interface Specification {
  position?: string[];
  color?: string[];
  size?: string[];
  shape?: string[];
  opacity?: string[];
  facets?: string[];
  page?: string[];
  filter?: string[];
  highFacets?: string[];
  geomType?: string[]
}

export interface View {
  schema: Specification;
  aggData: DataSource;
}

export type OperatorType = 'sum' | 'mean' | 'count';