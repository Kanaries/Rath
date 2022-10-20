import React from 'react';
import { CommandButton } from '@fluentui/react';
import intl from 'react-intl-universal';
import { IInsightSpace, Specification } from 'visual-insights';
import VisErrorBoundary from '../../../components/visErrorBoundary';
import { IFieldMeta, IRow, PreferencePanelConfig } from '../../../interfaces';
import ReactVega from '../../../components/react-vega';
import { distVis } from '../../../queries/distVis';
export interface IVizSpace extends IInsightSpace {
    schema: Specification;
    dataView: IRow[];
}

interface AssociationProps {
    visualConfig: PreferencePanelConfig;
    vizList: IVizSpace[];
    fieldMetas: IFieldMeta[];
    dataSource: IRow[];
    onSelectView: (viz: IVizSpace) => void;
}
const AssociationCharts: React.FC<AssociationProps> = (props) => {
    const { vizList, onSelectView, dataSource, fieldMetas } = props;

    return (
        <div style={{ border: 'solid 1px #bfbfbf', marginTop: '2em', backgroundColor: '#e7e7e7' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', overflow: 'auto' }}>
                {vizList.map((view, i) => {
                    const fieldsInView = fieldMetas.filter(
                        (m) => view.dimensions.includes(m.fid) || view.measures.includes(m.fid)
                    );
                    return (
                        <div
                            key={`associate-row-${i}`}
                            dir="ltr"
                            style={{
                                backgroundColor: '#fff',
                                margin: '6px',
                                padding: '10px',
                                flexGrow: 1,
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
                                <ReactVega
                                    dataSource={dataSource}
                                    spec={distVis({
                                        pattern: { fields: fieldsInView, imp: 0 },
                                    })}
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
