import React, { useMemo, useEffect, useState } from "react";
import { DashBoard } from "../../service";
import { DataSource, Field } from "../../global";
import { specification } from "visual-insights";
import { useComposeState } from "../../utils/index";
import { IconButton } from "office-ui-fabric-react";
import IndicatorCard from "./indicatorCard";
import ReactVega from '../../components/react-vega';
import { DataField, featureVis, targetVis } from '../../queries/index';

const IndicatorCardType = "indicator" as const;

interface CombinedChartProps {
  dashBoard: DashBoard;
  dataSource: DataSource;
  dimScores: [string, number, number, Field][];
}

interface GlobalFilters {
  [key: string]: any[];
}

const CombinedChart: React.FC<CombinedChartProps> = props => {
  const { dashBoard = [], dataSource = [], dimScores = [] } = props;
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
      schema.highFacets = schema.highFacets || [];
      schema.facets = schema.facets || [];
      return {
        dimensions,
        measures,
        type,
        schema
      };
    });
  }, [dashBoard, dataSource, dimScores]);

  const fieldFeatures = useMemo(() => {
    return dimScores.map(dim => dim[3])
  }, [dimScores]);

  const specList = useMemo<any[]>(() => {
    return chartSpecList.map((spec, index) => {
      const { dimensions, measures, schema, type } = spec;
      let dataFields: DataField[] = [];
      for (let dim of dimensions) {
        let targetField = fieldFeatures.find(f => f.name === dim);

        dataFields.push({
          name: dim,
          semanticType: (targetField ? targetField.type : 'nominal'),
          type: 'dimension'
        })
      }
      for (let mea of measures) {
        let targetField = fieldFeatures.find(f => f.name === mea);

        dataFields.push({
          name: mea,
          semanticType: (targetField ? targetField.type : 'nominal'),
          type: 'measure'
        })
      }
    
      if (type === "target" && measures.length === 1) {
        return {
          specIndex: index,
          type: IndicatorCardType,
          measures: measures,
          operator: "sum"
        };
      }
      let vegaSpec: any = {}
      if (type === 'target') {
        vegaSpec = targetVis(schema, dataFields)
      }

      if (type === 'feature') {
        vegaSpec = featureVis(schema, dataFields)
      }
      vegaSpec.specIndex = index
      return vegaSpec
    }) as any;
  }, [chartSpecList, fieldFeatures]);

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
  }, [dashBoard, chartStateList, setGlobalFilters]);

  const vsourceList = useMemo<Array<DataSource>>(() => {
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
    for (let i = 0; i < dashBoard.length; i++) {
      if (chartStateList[i]) {
        ans.push(dataSource);
        continue;
      }
      ans.push(ds);
    }
    return ans;
  }, [
    dashBoard,
    globalFilters,
    dataSource,
    chartStateList
  ]);
  return (
    <div>
      <div>
      {specList.filter(spec => spec.type === IndicatorCardType).map((spec, index) =>
          <IndicatorCard
            key={`ds-ind-chart-${index}`}
            dataSource={vsourceList[spec.specIndex]}
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
              {/* <div ref={node => { rendererRef(node, spec.specIndex) }}></div> */}
              <ReactVega
                dataSource={vsourceList[spec.specIndex]}
                spec={spec}
                signalHandler={
                  chartStateList[spec.specIndex] && (signalHandler[spec.specIndex] as any)
                }
              />
            </div>
            <div style={{ float: "left" }}>
              <IconButton
                title="use as filter"
                ariaLabel="use as filter"
                iconProps={{
                  iconName: chartStateList[spec.specIndex] ? "FilterSolid" : "Filter"
                }}
                onClick={() => {
                  setChartStateList(list => {
                    let nextList = [...list];
                    nextList[spec.specIndex] = !nextList[spec.specIndex];
                    if (!nextList[spec.specIndex]) {
                      setGlobalFilters(draft => {
                        for (let key in draft) {
                          draft[key] = [];
                        }
                      });
                    }
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
