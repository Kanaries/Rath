import { ISemanticType } from "visual-insights";
import { Specification } from "visual-insights/build/esm/commonTypes";
import { IFieldMeta, IResizeMode, IRow } from "../interfaces";
import { applySizeConfig } from "./base/utils";
export const geomTypeMap: { [key: string]: any } = {
  interval: "tick",
  tick: 'tick',
  boxplot: 'boxplot',
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

// FIXME： 这里没有考虑repeat的情况
function adjustGeomType (geomType: string, dataSource: IRow[], measures: string[]): string {
  if (geomType === 'interval') {
    for (let mea of measures) {
      const valueSet: Set<any> = new Set();
      for (let i = 0; i < dataSource.length; i++) {
        valueSet.add(dataSource[i][mea]);
        if (valueSet.size > 16) return 'boxplot'
      }
    }
    return 'point'
  }
  return geomType;
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
  let gt = adjustGeomType(geomType[0], dataSource, measures);
  if (gt === 'line') {
    const discreteChannels = Object.values(query).flatMap(c => c).filter(c => getFieldSemanticType(c) !== 'quantitative');
    const crossValues = discreteChannels.map(c => getFieldMeta(c)).filter(c => c !== undefined).map(c => c!.features.unique).reduce((t, v) => t * v, 1)
    if (dataSource.length < crossValues) {
      gt = 'area';
    }
  }
  let spec: any = {
    // width: chartWidth,
    data: {
      values: dataSource
    }
  };
  let markType =  gt && geomTypeMap[gt]
  ? geomTypeMap[gt]
  : gt;
  
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
  // if (geomType[0] === 'interval') {
  //   const valueAxis = [fieldMap.x, fieldMap.y].filter(f => getFieldSemanticType(f) === 'quantitative');
  //   const catAxis = [fieldMap.x, fieldMap.y].filter(f => getFieldSemanticType(f) !== 'quantitative');
  //   if (valueAxis.length > 0 && catAxis.length > 0) {
  //     spec.transform = []
  //     spec.transform.push(
  //       {
  //         "aggregate": [{"op": "mean", "field": valueAxis[0], "as": `aggregate_${valueAxis[0]}`}],
  //         "groupby": catAxis
  //       },
  //       {
  //         "window": [{"op": "row_number", "as": "rank"}],
  //         "sort": [{ "field": `aggregate_${valueAxis[0]}`, "order": "descending" }]
  //       },
  //       {
  //         "calculate": `datum.rank < 10 ? datum['${catAxis[0]}'] : 'All Others'`, "as": "ranked_director"
  //       }
  //     )
  //     for (let c in basicSpec.encoding) {
  //       if (fieldMap[c] === valueAxis[0]) {
  //         basicSpec.encoding[c].field = `aggregate_${valueAxis[0]}`
  //       }
  //       if (fieldMap[c] === catAxis[0]) {
  //         basicSpec.encoding[c].field = 'ranked_director'
  //       }
  //     }
  //   }
  // }
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
  if (gt === 'line') {
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
