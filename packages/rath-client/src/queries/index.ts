import { FieldType } from 'visual-insights'

export const geomTypeMap: {[key: string]: any} = {
  interval: 'bar',
  line: 'line',
  point: 'point',
  density: 'rect'
}

export interface DataField {
  name: string;
  semanticType: FieldType;
  type: 'dimension' | 'measure';
}
