import React, { useMemo, useEffect, useState } from "react";
import { DashBoard } from "../../service";
import { DataSource, Field, FieldType } from "../../global";
import { specification } from "visual-insights";
import embed, { VisualizationSpec } from "vega-embed";
import { VegaLite } from "react-vega";
import { geomTypeMap } from "../../demo/vegaBase";
import produce from "immer";
import { useComposeState } from "../../utils/index";
import { IconButton } from "office-ui-fabric-react";

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
    if (fieldType === "quantitative" && measures.includes(field)) {
      return true;
    }
    return false;
  }

  const specList = useMemo<any[]>(() => {
    return chartSpecList.map((spec, index) => {
      const { dimensions, measures, schema } = spec;

      const markType =
        schema.geomType![0] && geomTypeMap[schema.geomType![0]]
          ? geomTypeMap[schema.geomType![0]]
          : schema.geomType![0];
      return {
        // transform: filters.length > 0 && [...filters],
        // width: 300,
        data: { name: "dataSource" },
        padding: 26,
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
            aggregate:
              shouldFieldAggregate(
                schema.position![0],
                dimensions,
                measures,
                markType
              ) && "sum"
          },
          y: schema.position![1] && {
            field: schema.position![1],
            type: getFieldType(schema.position![1]),
            aggregate:
              shouldFieldAggregate(
                schema.position![1],
                dimensions,
                measures,
                markType
              ) && "sum"
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
          color: schema.color![0] && {
            field: schema.color![0],
            type: schema.color![0] && getFieldType(schema.color![0])
          }
        }
      };
    }) as any;
  }, [chartSpecList]);
  const dataSourceContainer = useMemo(() => {
    return { dataSource };
  }, [dataSource]);

  const signalHandler = useMemo(() => {
    return dashBoard.map((d, index) => {
      return {
        sl: (name: any, values: any) => {
          if (chartStateList[index]) {
            setGlobalFilters(draft => {
              console.log(values);
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
  }, [dashBoard, chartStateList]);
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
  }, [dashBoard, globalFilters, dataSource, chartStateList]);

  return (
    <div>
      {specList.map((spec, index) => (
        <div
          key={`ds-chart-${index}`}
          style={{ float: "left", padding: "4px", margin: "2px", height: '380px', overflowY: 'auto' }}
        >
          <div>
            <IconButton
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
            { chartStateList[index] && <span style={{ fontSize: 12, fontWeight: 300, lineHeight: '32px' }}>Used as filter</span> }
          </div>
          <VegaLite
            data={vsourceList[index]}
            spec={spec}
            actions={false}
            signalListeners={
              chartStateList[index] && (signalHandler[index] as any)
            }
          />
        </div>
      ))}
    </div>
  );
};

export default CombinedChart;
