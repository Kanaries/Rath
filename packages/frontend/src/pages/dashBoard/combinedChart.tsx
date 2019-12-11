import React, { useMemo, useEffect, useState } from "react";
import { DashBoard } from "../../service";
import { DataSource, Field, FieldType } from "../../global";
import { specification } from "visual-insights";
import { VegaLite } from "react-vega";
// import { geomTypeMap } from "../../demo/vegaBase";
import { useComposeState } from "../../utils/index";
import { IconButton } from "office-ui-fabric-react";
import IndicatorCard from "./indicatorCard";

const IndicatorCardType = "indicator" as const;
// tmp: for now, we support rect in dashboard because the number of fields in a view can be controlled here.
const geomTypeMap: {[key: string]: any} = {
  interval: 'bar',
  line: 'line',
  point: 'point',
  density: 'rect'
}
interface CombinedChartProps {
  dashBoard: DashBoard;
  dataSource: DataSource;
  dimScores: [string, number, number, Field][];
}

interface GlobalFilters {
  [key: string]: any[];
}

const CombinedChart: React.FC<CombinedChartProps> = props => {
  const { dashBoard, dataSource, dimScores } = props;
  const [globalFilters, setGlobalFilters] = useComposeState<GlobalFilters>({});
  const [chartStateList, setChartStateList] = useState<boolean[]>([]);

  useEffect(() => {
    setChartStateList(dashBoard.map(() => false));
  }, [dashBoard]);
  const filedDomains = useMemo(() => {
    const fieldList = dimScores.map(f => f[0]);
    let domainDict: {[key: string]: any[]} = {};
    let dsLen = dataSource.length;
    let fLen = fieldList.length;
    for (let i = 0; i < fLen; i++) {
      if (dimScores[i][3].type !== 'quantitative') {
        continue;
        // tmp
      }
      let fieldName = fieldList[i];
      domainDict[fieldName] = [0, 100];
      let min = Infinity;
      let max = -Infinity;
      for (let j = 0; j < dsLen; j++) {
        min = Math.min(dataSource[j][fieldName], min)
        max = Math.max(dataSource[j][fieldName], max)
      }
      domainDict[fieldName] = [min, max];
    }
    return domainDict;
  }, [dataSource, dimScores])
  const chartSpecList = useMemo(() => {
    if (!dashBoard || !dataSource || !dimScores) {
      return [];
    }
    return dashBoard.map(board => {
      const { dimensions, measures, type } = board;
      const fieldScores = dimScores.filter(field => {
        return dimensions.includes(field[0]) || measures.includes(field[0]);
      });
      let { schema } = specification(
        fieldScores,
        dataSource,
        dimensions,
        measures
      );
      schema.position = schema.position || [];
      schema.color = schema.color || [];
      schema.opacity = schema.opacity || [];
      schema.size = schema.size || [];
      schema.shape = schema.shape || [];
      schema.geomType = schema.geomType || [];
      return {
        dimensions,
        measures,
        type,
        schema
      };
    });
  }, [dashBoard, dataSource, dimScores]);

  const fieldFeatures = dimScores.map(dim => dim[3]);

  function getFieldType(field: string): FieldType {
    let targetField = fieldFeatures.find(f => f.name === field);
    return targetField ? targetField.type : "nominal";
  }

  function shouldFieldAggregate(
    field: string,
    dimensions: string[],
    measures: string[],
    geomType: string
  ): boolean {
    if (geomType === "point") {
      return false;
    }
    const fieldType = getFieldType(field);
    if (geomType === 'rect') {
      return fieldType !== 'quantitative'
    }
    if (fieldType === "quantitative" && measures.includes(field)) {
      return true;
    }
    return false;
  }

  const specList = useMemo<any[]>(() => {
    return chartSpecList.map((spec, index) => {
      const { dimensions, measures, schema, type } = spec;
      if (type === "target" && measures.length === 1) {
        return {
          type: IndicatorCardType,
          measures: measures,
          operator: "sum"
        };
      }

      let markType =
        schema.geomType![0] && geomTypeMap[schema.geomType![0]]
          ? geomTypeMap[schema.geomType![0]]
          : schema.geomType![0];
      const xType = getFieldType(schema.position![0]);
      const yType = getFieldType(schema.position![1]);
      const colorType = getFieldType(schema.color![0]);
      const xAgg = shouldFieldAggregate(schema.position![0], dimensions, measures, markType);
      const yAgg = shouldFieldAggregate(schema.position![1], dimensions, measures, markType);
      let adjustColorField = schema.color![0];
      if (markType === 'rect') {
        if (schema.color![0] && colorType !== 'quantitative') {
          markType = 'point';
        } else if (schema.opacity![0] && schema.size![0]) {
          adjustColorField = schema.size![0] || schema.opacity![0];
        }
      }
      const mustDefineScale = xType === 'quantitative' && yType === 'quantitative' && markType !== 'rect';
      return {
        // transform: filters.length > 0 && [...filters],
        // width: 300,
        data: { name: "dataSource" },
        // padding: 26,
        autosize: {
          type: "pad"
        },
        mark: markType,
        selection: {
          sl: {
            type: markType === "bar" ? "single" : "interval",
            encodings: markType === "bar" ? ["x"] : undefined
          }
        },
        encoding: {
          x: schema.position![0] && {
            field: schema.position![0],
            type: getFieldType(schema.position![0]),
            bin: markType === 'rect' && xType === 'quantitative' && { maxbins: 30 },
            aggregate: markType !== 'rect' && xAgg && 'sum',
            scale: mustDefineScale && !xAgg ? { domain: filedDomains[schema.position![0]] } : undefined
          },
          y: schema.position![1] && {
            field: schema.position![1],
            type: getFieldType(schema.position![1]),
            bin: markType === 'rect' && yType === 'quantitative' && { maxbins: 30 },
            aggregate: markType !== 'rect' && yAgg && 'sum',
            scale: mustDefineScale && !yAgg ? { domain: filedDomains[schema.position![1]] } : undefined
          },
          size: schema.size![0] && {
            field: schema.size![0],
            type: getFieldType(schema.size![0])
          },
          opacity: schema.opacity![0] && {
            field: schema.opacity![0],
            type: getFieldType(schema.opacity![0])
          },
          shape: schema.shape![0] && {
            field: schema.shape![0],
            type: getFieldType(schema.shape![0])
          },
          color: (adjustColorField || markType === 'rect') && {
            field: adjustColorField,
            aggregate: markType === 'rect' && getFieldType(adjustColorField) === 'quantitative' && (adjustColorField ? 'sum' : 'count'),
            type: adjustColorField && getFieldType(adjustColorField)
          }
        }
      };
    }) as any;
  }, [chartSpecList, filedDomains]);
  console.log(specList)
  const dataSourceContainer = useMemo(() => {
    return { dataSource };
  }, [dataSource, specList, dimScores]);

  const signalHandler = useMemo(() => {
    return dashBoard.map((d, index) => {
      return {
        sl: (name: any, values: any) => {
          if (chartStateList[index]) {
            setGlobalFilters(draft => {
              if (Object.keys(values).length === 0) {
                for (let key in draft) {
                  // delete draft[key]
                  draft[key] = [];
                }
              } else {
                for (let key in values) {
                  draft[key] = values[key];
                }
              }
            });
          }
        }
      };
    });
  }, [dashBoard, chartStateList, dimScores, specList]);
  const vsourceList = useMemo<Array<{ dataSource: DataSource }>>(() => {
    let ans = [];
    const filters = Object.keys(globalFilters).map(fieldName => {
      return {
        fieldName: fieldName,
        filter: globalFilters[fieldName],
        // protentional risk
        isRange:
          globalFilters[fieldName].length === 2 &&
          typeof globalFilters[fieldName][0] === "number" &&
          typeof globalFilters[fieldName][1] === "number" &&
          globalFilters[fieldName][0] < globalFilters[fieldName][1]
      };
    });
    for (let i = 0; i < dashBoard.length; i++) {
      if (chartStateList[i]) {
        ans.push(dataSourceContainer);
        continue;
      }
      const ds = dataSource.filter(record => {
        return filters.every(f => {
          if (f.filter.length === 0) {
            return true;
          }
          if (f.isRange) {
            return (
              record[f.fieldName] >= f.filter[0] &&
              record[f.fieldName] <= f.filter[1]
            );
          } else {
            return f.filter.includes(record[f.fieldName]);
          }
        });
      });
      ans.push({ dataSource: ds });
    }
    return ans;
  }, [
    dashBoard,
    globalFilters,
    dataSource,
    chartStateList,
    specList,
    dataSourceContainer
  ]);
  return (
    <div>
      <div>
      {specList.filter(spec => spec.type === IndicatorCardType).map((spec, index) =>
          <IndicatorCard
            key={`ds-ind-chart-${index}`}
            dataSource={vsourceList[index].dataSource}
            measures={spec.measures}
          />
      )}
      </div>
      <div>
      {specList.filter(spec => spec.type !== IndicatorCardType).map((spec, index) =>
          <div
            key={`ds-chart-${index}`}
            style={{
              display: 'inline-block',
              padding: "4px",
              margin: "2px",
              height: "380px",
              overflowY: "auto"
            }}
          >
            <div
              style={{ float: "left", minWidth: "300px", minHeight: "300px" }}
            >
              <VegaLite
                data={vsourceList[index]}
                spec={spec}
                actions={true}
                signalListeners={
                  chartStateList[index] && (signalHandler[index] as any)
                }
              />
            </div>
            <div style={{ float: "left" }}>
              <IconButton
                title="use as filter"
                ariaLabel="use as filter"
                iconProps={{
                  iconName: chartStateList[index] ? "FilterSolid" : "Filter"
                }}
                onClick={() => {
                  setChartStateList(list => {
                    let nextList = [...list];
                    nextList[index] = !nextList[index];
                    return nextList;
                  });
                }}
              />
            </div>
          </div>
      )}
      </div>
    </div>
  );
};

export default CombinedChart;
