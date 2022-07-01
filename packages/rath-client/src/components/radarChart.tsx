import React, { useRef, useEffect, useMemo } from 'react';
import embed from 'vega-embed';
import { scheme } from 'vega';
import { DefaultIWorker } from "visual-insights/build/esm/insights/dev";

scheme('threshold', ['#1890ff', '#ffccc7']);

interface RadarChartProps {
  keyField: string;
  valueField: string;
  dataSource: any[];
  threshold: number;
}
interface DataRecord {
  key: string;
  value: number;
  category: 0 | 1;
}
const RadarChart: React.FC<RadarChartProps> = props => {
  const { keyField, valueField, dataSource = [], threshold } = props;
  const container = useRef<HTMLDivElement>(null);
  const viewData = useMemo(() => {
    let data: DataRecord[] = dataSource.map(record => {
      return {
        key: record[keyField],
        value: Math.round(record[valueField] * 1000) / 1000,
        category: 0
      }
    });
    Object.values(DefaultIWorker).forEach(type => {
      if (!data.find(d => d.key === type)) {
        data.push({
          key: type,
          value: 0,
          category: 0
        })
      }
    })
    let ruleData: DataRecord[] = data.map(record => {
      return {
        key: record.key,
        value: threshold,
        category: 1
      }
    })
    return data.concat(ruleData);
  }, [keyField, valueField, dataSource, threshold])
  useEffect(() => {
    if (container.current) {
      embed(container.current, {
        width: 280,
        height: 280,
        padding: 50,
        autosize: { type: "none", contains: "padding" },

        signals: [{ name: "radius", update: "width / 2" }],

        data: [
          {
            name: "table",
            values: viewData
          },
          {
            name: "keys",
            source: "table",
            transform: [
              {
                type: "aggregate",
                groupby: ["key"]
              }
            ]
          }
        ],

        scales: [
          {
            name: "angular",
            type: "point",
            range: { signal: "[-PI, PI]" },
            padding: 0.5,
            domain: { data: "table", field: "key" }
          },
          {
            name: "radial",
            type: "linear",
            range: { signal: "[0, radius]" },
            zero: true,
            nice: false,
            domain: [0, 1],
            domainMin: 0
          },
          {
            name: "color",
            type: "ordinal",
            domain: { data: "table", field: "category" },
            range: { scheme: "threshold" }
          }
        ],

        encode: {
          enter: {
            x: { signal: "radius" },
            y: { signal: "radius" }
          }
        },

        marks: [
          {
            type: "group",
            name: "categories",
            zindex: 1,
            from: {
              facet: { data: "table", name: "facet", groupby: ["category"] }
            },
            marks: [
              {
                type: "line",
                name: "category-line",
                from: { data: "facet" },
                encode: {
                  enter: {
                    interpolate: { value: "linear-closed" },
                    x: {
                      signal:
                        "scale('radial', datum.value) * cos(scale('angular', datum.key))"
                    },
                    y: {
                      signal:
                        "scale('radial', datum.value) * sin(scale('angular', datum.key))"
                    },
                    stroke: { scale: "color", field: "category" },
                    strokeWidth: { value: 1 },
                    fill: { scale: "color", field: "category" },
                    fillOpacity: { value: 0.1 }
                  }
                }
              },
              {
                type: "text",
                name: "value-text",
                from: { data: "category-line" },
                encode: {
                  enter: {
                    x: { signal: "datum.x" },
                    y: { signal: "datum.y" },
                    text: { signal: "datum.datum.value" },
                    align: { value: "center" },
                    baseline: { value: "middle" },
                    fill: { value: "#262626" }
                  }
                }
              }
            ]
          },
          {
            type: "rule",
            name: "radial-grid",
            from: { data: "keys" },
            zindex: 0,
            encode: {
              enter: {
                x: { value: 0 },
                y: { value: 0 },
                x2: { signal: "radius * cos(scale('angular', datum.key))" },
                y2: { signal: "radius * sin(scale('angular', datum.key))" },
                stroke: { value: "lightgray" },
                strokeWidth: { value: 1 }
              }
            }
          },
          {
            type: "text",
            name: "key-label",
            from: { data: "keys" },
            zindex: 1,
            encode: {
              enter: {
                x: {
                  signal: "(radius + 5) * cos(scale('angular', datum.key))"
                },
                y: {
                  signal: "(radius + 5) * sin(scale('angular', datum.key))"
                },
                text: { field: "key" },
                align: [
                  {
                    test: "abs(scale('angular', datum.key)) > PI / 2",
                    value: "right"
                  },
                  {
                    value: "left"
                  }
                ],
                baseline: [
                  {
                    test: "scale('angular', datum.key) > 0",
                    value: "top"
                  },
                  {
                    test: "scale('angular', datum.key) == 0",
                    value: "middle"
                  },
                  {
                    value: "bottom"
                  }
                ],
                fill: { value: "black" },
                fontWeight: { value: "bold" }
              }
            }
          },
          {
            type: "line",
            name: "outer-line",
            from: { data: "radial-grid" },
            encode: {
              enter: {
                interpolate: { value: "linear-closed" },
                x: { field: "x2" },
                y: { field: "y2" },
                stroke: { value: "lightgray" },
                strokeWidth: { value: 1 }
              }
            }
          }
        ]
      } as any, {
        actions: false
      });
    }
  }, [viewData]);
  return <div ref={container}></div>
}

export default RadarChart;
