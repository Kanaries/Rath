import React from 'react';
import { CommandButton } from '@fluentui/react';
import intl from 'react-intl-universal';
import { IInsightSpace } from 'visual-insights';
import VisErrorBoundary from '../../../components/visErrorBoundary';
import { IFieldMeta, IRow, PreferencePanelConfig } from '../../../interfaces';
import ReactVega from '../../../components/react-vega';
import { distVis } from '../../../queries/distVis';
import { VegaThemeConfig } from '../../../queries/themes/config';
import { AssoViewContainer, AssociationContainer } from './components';

interface AssociationProps {
    visualConfig: PreferencePanelConfig;
    vizList: IInsightSpace[];
    fieldMetas: IFieldMeta[];
    dataSource: IRow[];
    onSelectView: (viz: IInsightSpace) => void;
    themeConfig?: VegaThemeConfig;
}
const AssociationCharts: React.FC<AssociationProps> = (props) => {
    const { vizList, onSelectView, dataSource, fieldMetas, themeConfig } = props;

    return (
        <AssociationContainer>
            <div className="asso-content-container">
                {vizList.map((view, i) => {
                    const fieldsInView = fieldMetas.filter((m) => view.dimensions.includes(m.fid) || view.measures.includes(m.fid));
                    return (
                        <AssoViewContainer key={`associate-row-${i}`} dir="ltr">
                            <div>
                                <CommandButton
                                    iconProps={{ iconName: 'Lightbulb' }}
                                    text={intl.get('megaAuto.analysis')}
                                    ariaLabel={intl.get('megaAuto.analysis')}
                                    onClick={() => {
                                        onSelectView(view);
                                    }}
                                />
                            </div>
                            <VisErrorBoundary>
                                <ReactVega
                                    dataSource={dataSource}
                                    spec={distVis({
                                        pattern: { fields: fieldsInView, imp: 0 }
                                    })}
                                    actions={false}
                                    config={themeConfig}
                                />
                            </VisErrorBoundary>
                        </AssoViewContainer>
                    );
                })}
            </div>
        </AssociationContainer>
    );
};

export default AssociationCharts;
