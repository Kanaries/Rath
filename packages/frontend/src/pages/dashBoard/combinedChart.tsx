import React, { useMemo, useEffect, useRef } from "react";
import { DashBoard } from "../../service";
import { DataSource, Field, FieldType } from "../../global";
import { specification } from "visual-insights";
import embed, { VisualizationSpec } from "vega-embed";
import { geomTypeMap } from "../../demo/vegaBase";

interface CombinedChartProps {
  dashBoard: DashBoard;
  dataSource: DataSource;
  dimScores: [string, number, number, Field][];
}
const CombinedChart: React.FC<CombinedChartProps> = props => {
  const { dashBoard, dataSource, dimScores } = props;
  const container = useRef<HTMLDivElement>(null);
  const chartSpecList = useMemo(() => {
    if (!dashBoard || !dataSource || !dimScores) {
      return [];
    }
    return dashBoard.map(board => {
      const { dimensions, measures } = board;
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
    measures: string[]
  ): boolean {
    const fieldType = getFieldType(field);
    if (fieldType === "quantitative" && measures.includes(field)) {
      return true;
    }
    return false;
  }

  useEffect(() => {
    if (container.current) {
      embed(
        container.current,
        {
          width: 600,
          data: { values: dataSource },
          columns: 3,
          concat: chartSpecList.map((spec, index) => {
            const { dimensions, measures, schema } = spec;
            const filters = [];
            for (let i = 0; i < chartSpecList.length; i++) {
              if (index !== i) {
                filters.push({
                  filter: { selection: `selection-${i}` }
                });
              }
            }
            const markType =
              schema.geomType![0] && geomTypeMap[schema.geomType![0]]
                ? geomTypeMap[schema.geomType![0]]
                : schema.geomType![0];
            return {
              transform: [...filters],
              mark: markType,
              selection: {
                [`selection-${index}`]: {
                  type: "interval"
                }
              },
              encoding: {
                x: {
                  field: schema.position![0],
                  type: getFieldType(schema.position![0]),
                  aggregate:
                    shouldFieldAggregate(schema.position![0], dimensions, measures) &&
                    markType !== "point"
                      ? "sum"
                      : undefined
                },
                y: {
                  field: schema.position![1],
                  type: getFieldType(schema.position![1]),
                  aggregate:
                    shouldFieldAggregate(schema.position![1], dimensions, measures) &&
                    markType !== "point"
                      ? "sum"
                      : undefined
                }
              }
            };
          }) as any
        },
        {
          mode: "vega-lite"
        }
      );
    }
  });
  return <div ref={container}>{JSON.stringify(chartSpecList, null, 2)}</div>;
};

export default CombinedChart;
