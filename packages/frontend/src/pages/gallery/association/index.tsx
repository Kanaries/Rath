import React, { useMemo } from "react";
import VisDescription from "../../../plugins/visSummary/description";
import useDigDimension, { DigDimensionProps } from "./digDimension";
import BaseChart, { Specification } from "../../../demo/vegaBase";
import { Subspace } from "../../../service";

function isDimensionEqual(dimensions1: string[], dimensions2: string[]) {
  if (dimensions1.length !== dimensions2.length) {
    return false;
  }
  return dimensions1.every(dim1 => {
    return dimensions2.includes(dim1);
  });
}
interface AssociationProps {
  digDimensionProps: DigDimensionProps;
  subspaceList: Subspace[];
}
const Association: React.FC<AssociationProps> = props => {
  const { digDimensionProps, subspaceList } = props;
  const { dataSource, visualConfig, fieldScores } = digDimensionProps;
  const relatedCharts = useDigDimension(digDimensionProps);
  const fieldFeatures = fieldScores.map(f => f[3]);
  return (
    <div>
      <div className="ms-Grid">
        {relatedCharts.map(view => {
          let currentSpace = subspaceList.find(space => {
            return isDimensionEqual(space.dimensions, view.dimensions);
          });
          return (
            <div
              className="ms-Grid-row"
              style={{
                border: "solid 1px #bfbfbf",
                margin: "1em",
                padding: "1em"
              }}
            >
              <div
                className="ms-Grid-col ms-sm6 ms-md8 ms-lg9"
                style={{ overflow: "auto" }}
              >
                <BaseChart
                  aggregator={visualConfig.aggregator}
                  defaultAggregated={visualConfig.defaultAggregated}
                  defaultStack={visualConfig.defaultStack}
                  dimensions={view.dimensions}
                  measures={view.measures}
                  dataSource={dataSource}
                  schema={view.schema}
                  fieldFeatures={fieldFeatures}
                />
              </div>
              <div
                className="ms-Grid-col ms-sm6 ms-md4 ms-lg3"
                style={{ fontSize: 14, color: "#8a8886", overflow: "auto" }}
              >
                {currentSpace && (
                  <VisDescription
                    dimensions={view.dimensions}
                    measures={view.measures}
                    dimScores={fieldScores}
                    space={currentSpace}
                    spaceList={subspaceList}
                    schema={view.schema}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Association;
