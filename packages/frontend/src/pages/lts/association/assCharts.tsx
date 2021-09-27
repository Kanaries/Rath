import React from "react";
// import VisDescription from "../../../plugins/visSummary/description";
// import useDigDimension, { DigDimensionProps } from "./digDimension";
import BaseChart from "../../../visBuilder/vegaBase";
import { FieldSummary, Subspace } from "../../../service";
// import { IconButton, Stack } from "office-ui-fabric-react";
import { IInsightSpace, Specification } from "visual-insights";
import { PreferencePanelConfig } from "../../../components/preference";
import { IRow } from "../../../interfaces";

export interface IVizSpace extends IInsightSpace {
    schema: Specification;
    dataView: IRow[]
}

interface AssociationProps {
  visualConfig: PreferencePanelConfig;
//   subspaceList: Subspace[];
  vizList: IVizSpace[];
  fieldScores: FieldSummary[];
  dataSource: IRow[];
  onSelectView: (index: number) => void
}
const AssociationCharts: React.FC<AssociationProps> = props => {
  const { vizList, onSelectView, visualConfig, fieldScores, dataSource } = props;
//   const { dataSource, fieldScores } = digDimensionProps;
//   const relatedCharts = useDigDimension(digDimensionProps);
  const fieldFeatures = fieldScores.map(f => ({
    name: f.fieldName,
    type: f.type
  }));
  //className="ms-Grid"
  return (
    <div style={{ border: "solid 1px #bfbfbf", marginTop: '2em' }}>

      <div style={{ display: 'flex', flexWrap: 'wrap', overflow: 'auto' }}>
        {vizList.map((view, i) => {
          return (
            <div key={`associate-row-${i}`}
            //   className="ms-Grid-row"
              dir="ltr"
              style={{
                // border: "solid 1px #bfbfbf",
                margin: "1em",
                padding: "1em"
              }}
            >
              <BaseChart
                fixedWidth={false}
                  aggregator={visualConfig.aggregator}
                  defaultAggregated={view.schema.geomType && view.schema.geomType.includes("point") ? false : true}
                  defaultStack={visualConfig.defaultStack}
                  dimensions={view.dimensions}
                  measures={view.measures}
                  dataSource={dataSource}
                  schema={view.schema}
                  fieldFeatures={fieldFeatures}
                />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssociationCharts;
