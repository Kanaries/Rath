import { Specification } from "visual-insights/build/esm/commonTypes";
import { DataSource, Field, FieldType } from "../global";
export const geomTypeMap: { [key: string]: any } = {
  interval: "boxplot",
  line: "line",
  point: "point",
  // density: 'rect'
  density: "point"
};
interface BaseVisProps {
  query: Specification;
  dataSource: DataSource;
  dimensions: string[];
  measures: string[];
  aggregatedMeasures: Array<{op: string; field: string; as: string}>;
  fieldFeatures: Field[];
  defaultAggregated?: boolean;
  defaultStack?: boolean;
  stepSize?: number;
  viewSize?: number
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
    viewSize
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
  
  function getFieldType(field: string): FieldType {
    let targetField = fieldFeatures.find(f => f.name === field);
    return targetField ? targetField.type : "nominal";
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
  let spec: any = {
    // width: chartWidth,
    data: {
      values: dataSource
    }
  };
  let basicSpec: any = {
    // width: chartWidth,
    mark: {
      type:
        geomType[0] && geomTypeMap[geomType[0]]
          ? geomTypeMap[geomType[0]]
          : geomType[0],
      tooltip: true,
      opacity: 0.89
    },
    encoding: {}
  };

  if (typeof stepSize === 'number' && typeof viewSize === 'number') {
    const xFieldType = getFieldType(fieldMap['x']);
    const yFieldType = getFieldType(fieldMap['y']);
    spec.width = (xFieldType === 'quantitative' || xFieldType === 'temporal') ? viewSize : { step: stepSize };
    spec.height = (yFieldType === 'quantitative' || xFieldType === 'temporal') ? viewSize : { step: stepSize };
    basicSpec.width = spec.width;
    basicSpec.height = spec.height
  }

  for (let channel in fieldMap) {
    if (fieldMap[channel]) {
      basicSpec.encoding[channel] = {
        field: adjustField(fieldMap[channel]),
        type: getFieldType(fieldMap[channel])
      };
      if (
        ["x", "y"].includes(channel) &&
        getFieldType(fieldMap[channel]) === "quantitative" &&
        !defaultStack
      ) {
        basicSpec.encoding[channel].stack = null;
      }
    }
  }
  if (!defaultStack && opacity.length === 0) {
    basicSpec.encoding.opacity = { value: 0.7 };
  }
  // [start]图表配置修复，为了节省一些计算。这一部分和自动化推荐无关，只是对vega默认配置的调整
  // if (basicSpec.mark.type === 'boxplot') {
  //   basicSpec.mark.extent = 'min-max';
  // }
  // [end]
  if (geomType[0] === 'line') {
    const lineLayer = { ...basicSpec };
    for (let channel in fieldMap) {
      if (getFieldType(fieldMap[channel]) === 'quantitative') {
        // Discuss: should aggregator be controlled by top layer?
        lineLayer.encoding[channel]['aggregate'] = 'mean'
      }
    }
    spec = {
      ...spec,
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
  
  return spec;
}
