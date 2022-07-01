import React from "react";
import BaseChart from "../../../visBuilder/vegaBase";
import VisErrorBoundary from '../../../visBuilder/visErrorBoundary';
import { IInsightSpace, Specification } from "visual-insights";
import { PreferencePanelConfig } from "../../../components/preference";
import { IFieldMeta, IRow } from "../../../interfaces";
import { CommandButton } from "office-ui-fabric-react";
import intl from 'react-intl-universal';
export interface IVizSpace extends IInsightSpace {
    schema: Specification;
    dataView: IRow[]
}

interface AssociationProps {
    visualConfig: PreferencePanelConfig;
    //   subspaceList: Subspace[];
    vizList: IVizSpace[];
    fieldMetas: IFieldMeta[];
    dataSource: IRow[];
    onSelectView: (viz: IVizSpace) => void
}
const AssociationCharts: React.FC<AssociationProps> = props => {
    const { vizList, onSelectView, visualConfig, dataSource, fieldMetas } = props;
    //   const { dataSource, fieldScores } = digDimensionProps;
    //   const relatedCharts = useDigDimension(digDimensionProps);

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
                                margin: "6px",
                                padding: "10px",
                                flexGrow: 1
                            }}
                        >
                            <div>
                                <CommandButton
                                    iconProps={{ iconName: 'Lightbulb' }}
                                    text={intl.get('explore.digIn')}
                                    ariaLabel={intl.get('explore.digIn')}
                                    onClick={() => {
                                        onSelectView(view);
                                    }}
                                />
                            </div>
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
                                    fieldFeatures={fieldMetas}
                                />
                            </VisErrorBoundary>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AssociationCharts;
