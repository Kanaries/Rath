import React, { useCallback } from 'react';
import { observer } from 'mobx-react-lite'
import styled from 'styled-components';
import { useGlobalStore } from '../../../store';
import { CommandBarButton, Stack, IContextualMenuProps, Panel, PanelType } from 'office-ui-fabric-react';
import ViewField from './viewField';
import BaseChart from '../../../visBuilder/vegaBase';
import Association from '../association';
import { PIVOT_KEYS } from '../../../constants';
import intl from 'react-intl-universal';

const FieldsContainer = styled.div`
    margin-top: 1em;
    margin-bottom: 1em;
    display: flex;
`

const VizOperation: React.FC = props => {
    const { exploreStore, dataSourceStore, ltsPipeLineStore, commonStore } = useGlobalStore();
    const { forkView, visualConfig, showAsso } = exploreStore
    const { dimensions, measures } = dataSourceStore;
    const dimensionOptions: IContextualMenuProps = {
        items: dimensions.map(f => ({
            key: f,
            text: f,
            onClick: (e) => { exploreStore.addFieldToForkView('dimensions', f) }
        }))
    }
    const measureOptions: IContextualMenuProps = {
        items: measures.map(f => ({
            key: f,
            text: f,
            onClick: (e) => { exploreStore.addFieldToForkView('measures', f) }
        }))
    }

    const customizeAnalysis = useCallback(() => {
        exploreStore.bringToGrphicWalker();
        commonStore.setAppKey(PIVOT_KEYS.editor)
    }, [exploreStore, commonStore])

    const forkViewSpec = exploreStore.forkViewSpec;
    if (forkView !== null) {
        return <div>
            <Stack horizontal>
                <CommandBarButton menuProps={dimensionOptions} text={intl.get('common.dimension')} iconProps={{ iconName: 'AddTo' }} />
                <CommandBarButton menuProps={measureOptions} text={intl.get('common.measure')} iconProps={{ iconName: 'AddTo' }} />
                <CommandBarButton text={intl.get('lts.commandBar.editing')} iconProps={{ iconName: 'BarChartVerticalEdit' }} onClick={customizeAnalysis} />
                <CommandBarButton text={intl.get('lts.commandBar.associate')} iconProps={{ iconName: 'Lightbulb' }} onClick={() => {
                    exploreStore.getAssociatedViews();
                }} />
                <CommandBarButton text={intl.get('lts.commandBar.constraints')} iconProps={{ iconName: 'MultiSelect' }} />
            </Stack>
            <FieldsContainer>
                {forkView.dimensions.map(f => <ViewField type="dimension" text={f} key={f} />)}
            </FieldsContainer>
            <FieldsContainer>
                {forkView.measures.map((f, fIndex) => <ViewField type="measure" text={`${f}${visualConfig.defaultAggregated ? `(${forkView.ops[fIndex]})` : ''}`} key={f} />)}
            </FieldsContainer>
            <Panel isOpen={showAsso}
                type={PanelType.medium}
                onDismiss={() => {
                    exploreStore.setShowAsso(false);
            }}>
                <Association />
            </Panel>
            {
                forkViewSpec && <BaseChart
                    defaultAggregated={visualConfig.defaultAggregated}
                    defaultStack={visualConfig.defaultStack}
                    dimensions={forkView.dimensions}
                    measures={forkView.measures}
                    dataSource={visualConfig.defaultAggregated ? forkViewSpec.dataView : ltsPipeLineStore.dataSource}
                    schema={forkViewSpec.schema}
                    fieldFeatures={ltsPipeLineStore.fields.map(f =>({
                        name: f.key,
                        type: f.semanticType
                    }))}
                    aggregator={visualConfig.aggregator}
                />
            }
        </div>
    } else {
        return <div></div>
    }
}

export default observer(VizOperation)
