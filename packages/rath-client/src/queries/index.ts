import { FieldType } from 'visual-insights'
import { featureVis } from './featureVis'
import { targetVis } from './targetVis';
import { baseVis } from './baseVis';
import { commonVis } from './commonVis'

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

export { featureVis, targetVis, baseVis, commonVis }