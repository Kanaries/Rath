import React from 'react';
import { observer } from 'mobx-react-lite'
import styled from 'styled-components';
import { useGlobalStore } from '../../../store';
import { DefaultButton, Dropdown, IconButton, IContextualMenuProps } from 'office-ui-fabric-react';
import ViewField from './viewField';
import BaseChart from '../../../visBuilder/vegaBase';

const FieldsContainer = styled.div`
    margin-top: 1em;
    margin-bottom: 1em;
    display: flex;
`

const VizOperation: React.FC = props => {
    const { exploreStore, dataSourceStore, ltsPipeLineStore } = useGlobalStore();
    const { forkView, visualConfig } = exploreStore
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
    const forkViewSpec = exploreStore.forkViewSpec;
    if (forkView !== null) {
        return <div>
            <DefaultButton menuProps={dimensionOptions} text="Add Field" iconProps={{ iconName: 'Add' }} />
            <FieldsContainer>
                {forkView.dimensions.map(f => <ViewField type="dimension" text={f} key={f} />)}
            </FieldsContainer>
            <DefaultButton menuProps={measureOptions} text="Add Field" iconProps={{ iconName: 'Add' }} />
            <FieldsContainer>
                {forkView.measures.map((f, fIndex) => <ViewField type="measure" text={`${f}${visualConfig.defaultAggregated ? `(${forkView.ops[fIndex]})` : ''}`} key={f} />)}
            </FieldsContainer>
            {forkViewSpec == null ? 'null' : 'value'}
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
