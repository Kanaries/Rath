import React from "react";
import BaseChart from "../../../visBuilder/vegaBase";
import VisErrorBoundary from '../../../visBuilder/visErrorBoundary';
import { IFieldSummary, IInsightSpace, Specification } from "visual-insights";
import { PreferencePanelConfig } from "../../../components/preference";
import { IRow } from "../../../interfaces";
import { IconButton } from "office-ui-fabric-react";
import intl from 'react-intl-universal';
export interface IVizSpace extends IInsightSpace {
    schema: Specification;
    dataView: IRow[]
}

interface AssociationProps {
    visualConfig: PreferencePanelConfig;
    //   subspaceList: Subspace[];
    vizList: IVizSpace[];
    fieldScores: IFieldSummary[];
    dataSource: IRow[];
    onSelectView: (viz: IVizSpace) => void
}
const AssociationCharts: React.FC<AssociationProps> = props => {
    const { vizList, onSelectView, visualConfig, fieldScores, dataSource } = props;
    //   const { dataSource, fieldScores } = digDimensionProps;
    //   const relatedCharts = useDigDimension(digDimensionProps);
    const fieldFeatures = fieldScores.map(f => ({
        name: f.key,
        type: f.semanticType
    }));
    //className="ms-Grid"
    return (
        <div style={{ border: "solid 1px #bfbfbf", marginTop: '2em', backgroundColor: '#e7e7e7' }}>

            <div style={{ display: 'flex', flexWrap: 'wrap', overflow: 'auto' }}>
                {vizList.map((view, i) => {
                    // 旧：业务图表用
                    // const vizAggregate = view.schema.geomType && view.schema.geomType.includes("point") ? false : true;
                    return (
                        <div key={`associate-row-${i}`}
                            //   className="ms-Grid-row"
                            dir="ltr"
                            style={{
                                // border: "solid 1px #bfbfbf",
                                backgroundColor:'#fff',
                                margin: "1em",
                                padding: "1em"
                            }}
                        >
                            <VisErrorBoundary>
                                <BaseChart
                                    aggregator={visualConfig.aggregator}
                                    defaultAggregated={false}
                                    defaultStack={visualConfig.defaultStack}
                                    dimensions={view.dimensions}
                                    measures={view.measures}
                                    // dataSource={vizAggregate ? view.dataView : dataSource}
                                    dataSource={dataSource}
                                    schema={view.schema}
                                    fieldFeatures={fieldFeatures}
                                />
                            </VisErrorBoundary>
                            <IconButton
                                iconProps={{ iconName: 'Lightbulb' }}
                                title={intl.get('explore.digIn')}
                                ariaLabel={intl.get('explore.digIn')}
                                onClick={() => {
                                    onSelectView(view);
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AssociationCharts;
