import { ISemanticType } from "visual-insights";
import { Specification } from "visual-insights/build/esm/commonTypes";
import { IFieldMeta, IResizeMode, IRow } from "../interfaces";
import { applySizeConfig } from "./base/utils";
export const geomTypeMap: { [key: string]: any } = {
  interval: "tick",
  // interval: 'boxplot',
  line: "line",
  point: "point",
  area: 'area',
  // density: 'rect'
  density: "point"
};
interface BaseVisProps {
  query: Specification;
  dataSource: IRow[];
  dimensions: string[];
  measures: string[];
  aggregatedMeasures: Array<{op: string; field: string; as: string}>;
  fieldFeatures: IFieldMeta[];
  defaultAggregated?: boolean;
  defaultStack?: boolean;
  stepSize?: number;
  viewSize?: number;
  zoom: boolean;
  sizeMode?: IResizeMode;
  width?: number,
  height?: number
}

export function baseVis(props: BaseVisProps) {
  const {
    query,
    dataSource,
    // dimensions,
    measures,
    aggregatedMeasures,
    fieldFeatures,
    defaultAggregated,
    defaultStack,
    stepSize,
    // viewSize,
    width, height,
    zoom,
    sizeMode = IResizeMode.auto
  } = props;
  const {
    position = [],
    color = [],
    size = [],
    facets = [],
    opacity = [],
    geomType = [],
    // page = [],
  } = query;

  function adjustField(fieldName: string): string {
    if (defaultAggregated && measures.includes(fieldName)) {
      let aggField = aggregatedMeasures.find(mea => {
        return mea.field === fieldName;
      });
      return aggField ? aggField.as : fieldName;
    }
    return fieldName;
  }
  
  function getFieldSemanticType(fieldId: string): ISemanticType {
    let targetField = fieldFeatures.find(f => f.fid === fieldId);
    return targetField ? targetField.semanticType : "nominal";
  }

  function getFieldMeta (fieldId: string): IFieldMeta | undefined {
    return fieldFeatures.find(f => f.fid === fieldId);
  }

  function getFieldName(fieldId: string): string {
    let targetField = fieldFeatures.find(f => f.fid === fieldId);
    if (targetField) {
      return targetField.name ? targetField.name : targetField.fid
    }
    return '_'
  }

  const fieldMap: any = {
    x: position[0],
    y: position[1],
    color: color[0],
    size: size[0],
    opacity: opacity[0],
    row: facets[0],
    column: facets[1]
  };
  if (geomType[0] && geomType[0] === 'line') {
    const discreteChannels = Object.values(query).flatMap(c => c).filter(c => getFieldSemanticType(c) !== 'quantitative');
    const crossValues = discreteChannels.map(c => getFieldMeta(c)).filter(c => c !== undefined).map(c => c!.features.unique).reduce((t, v) => t * v, 1)
    if (dataSource.length < crossValues) {
      geomType[0] = 'area';
    }
  }
  let spec: any = {
    // width: chartWidth,
    data: {
      values: dataSource
    }
  };
  const markType =  geomType[0] && geomTypeMap[geomType[0]]
  ? geomTypeMap[geomType[0]]
  : geomType[0]
  let basicSpec: any = {
    // width: chartWidth,
    mark: {
      type: markType,
      tooltip: true,
      opacity: 0.88
    },
    encoding: {}
  };

  for (let channel in fieldMap) {
    if (fieldMap[channel]) {
      basicSpec.encoding[channel] = {
        field: adjustField(fieldMap[channel]),
        type: getFieldSemanticType(fieldMap[channel]),
        title: getFieldName(fieldMap[channel])
      };
      if (
        ["x", "y"].includes(channel) &&
        getFieldSemanticType(fieldMap[channel]) === "quantitative" &&
        !defaultStack
      ) {
        basicSpec.encoding[channel].stack = null;
      }
    }
  }
  applySizeConfig(basicSpec, {
    mode: sizeMode,
    width,
    height,
    stepSize,
    hasFacets: facets.length > 0
  })
  if (position.length === 1) {
    if (basicSpec.encoding.x) {
      basicSpec.encoding.x.bin = true;
      basicSpec.encoding.y = { aggregate: 'count' }
    } else {
      if (basicSpec.encoding.y) {
        basicSpec.encoding.x.bin = true;
        basicSpec.encoding.x = { aggregate: 'count' }
      }
    }
    basicSpec.mark.type = 'bar'
  }

  if (!defaultStack && opacity.length === 0) {
    basicSpec.encoding.opacity = { value: 0.7 };
  }
  // [start]图表配置修复，为了节省一些计算。这一部分和自动化推荐无关，只是对vega默认配置的调整
  // if (basicSpec.mark.type === 'boxplot') {
  //   basicSpec.mark.extent = 'min-max';
  // }
  // [end]
  if (basicSpec.mark.type === 'boxplot') {
    if (query.color && query.color.length > 0 && !(query.facets && query.facets.length > 0) && getFieldSemanticType(query.color[0]) === 'nominal') {
      basicSpec.encoding.column = basicSpec.encoding.color
    }
  }
  if (geomType[0] === 'line') {
    const lineLayer = { ...basicSpec };
    for (let channel in fieldMap) {
      const meta = getFieldMeta(fieldMap[channel]);

      if (meta?.semanticType === 'quantitative' && meta.analyticType === 'measure') {
        // Discuss: should aggregator be controlled by top layer?
        lineLayer.encoding[channel]['aggregate'] = 'mean'
      }
    }
    spec = {
      ...spec,
      autosize: basicSpec.autosize,
      layer: [
        lineLayer,
        {
          ...basicSpec
        },
        {
          ...basicSpec,
          mark: {
            type: 'errorband',
            opacity: 0.6
          }
        }
      ]
    }
  } else {
    // if (page.length === 0) {
    // if 单一spec的情况，后续要支持多spec concat的情况，可以参考本次提交记录删除的page的情况。
      spec = {
        ...spec,
        ...basicSpec
      };
    // }
  }
  if (zoom) {
    spec.params = [{
      name: 'grid',
      select: 'interval',
      bind: 'scales'
    }]
  }
  return spec;
}
