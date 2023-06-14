import React, { useMemo } from 'react';
import { CommandButton, Spinner } from '@fluentui/react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import { IInsightSpace } from 'visual-insights';
import VisErrorBoundary from '../../../components/visErrorBoundary';
import { IFieldMeta, IRow, PreferencePanelConfig } from '../../../interfaces';
import ReactVega from '../../../components/react-vega';
import { distVis } from '../../../queries/distVis';
import { VegaGlobalConfig } from '../../../queries/themes/config';
import { useGlobalStore } from '../../../store';
import { labDistVisService } from '../../../services';
import { useAsyncViews } from '../../semiAutomation/predictZone/utils';
import { AssoViewContainer, AssociationContainer } from './components';

interface AssociationProps {
    visualConfig: PreferencePanelConfig;
    vizList: IInsightSpace[];
    fieldMetas: IFieldMeta[];
    dataSource: IRow[];
    onSelectView: (viz: IInsightSpace) => void;
    themeConfig?: VegaGlobalConfig;
}
const AssociationCharts: React.FC<AssociationProps> = (props) => {
    const { vizList, onSelectView, dataSource, fieldMetas, themeConfig } = props;
    const { semiAutoStore } = useGlobalStore();
    const { settings: { vizAlgo } } = semiAutoStore;

    const specList = useMemo(() => {
        if (vizAlgo === 'lite') {
            return Promise.resolve(vizList.map(view => {
                const fieldsInView = fieldMetas.filter((m) => view.dimensions.includes(m.fid) || view.measures.includes(m.fid));
                return distVis({
                    pattern: { fields: fieldsInView, imp: 0 }
                });
            }));
        }
        return labDistVisService({
            dataSource,
            items: vizList.map(view => {
                const fieldsInView = fieldMetas.filter((m) => view.dimensions.includes(m.fid) || view.measures.includes(m.fid));
                return {
                    pattern: { fields: fieldsInView, imp: 0 },
                };
            }),
        });
    }, [vizAlgo, dataSource, vizList, fieldMetas]);

    const views = useAsyncViews(specList);

    return (
        <AssociationContainer>
            <div className="asso-content-container">
                {vizList.map((view, i) => {
                    const spec = views[i];
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
                            {spec ? (
                                <VisErrorBoundary>
                                    <ReactVega
                                        dataSource={dataSource}
                                        spec={spec}
                                        actions={false}
                                        config={themeConfig}
                                    />
                                </VisErrorBoundary>
                            ) : (
                                <Spinner />
                            )}
                        </AssoViewContainer>
                    );
                })}
            </div>
        </AssociationContainer>
    );
};

export default observer(AssociationCharts);
