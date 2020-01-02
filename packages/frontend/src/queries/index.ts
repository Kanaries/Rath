import { FieldType } from "visual-insights/src/commonTypes";
import { featureVis } from './featureVis'
import { targetVis } from './targetVis';
import { baseVis } from './baseVis';

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

export { featureVis, targetVis, baseVis }