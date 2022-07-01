import React from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../../store';
import ViewField from './viewField';

const PillsContainer = styled.div`
    margin-top: 1em;
    margin-bottom: 1em;
    display: flex;
`

const FieldContainer: React.FC = props => {
    const { dataSourceStore, exploreStore } = useGlobalStore();
    const { forkView, visualConfig } = exploreStore;
    const { dimFields, meaFields } = dataSourceStore;
    
    if (forkView === null) {
        return <div></div>
    }
    return <div>
        <PillsContainer>
            {forkView.dimensions.map(f => {
                const field = dimFields.find(d => d.fid === f);
                return <ViewField type="dimension"
                    text={(field ? field.name : f) || f}
                    key={f}
                    onRemove={() => {
                        exploreStore.removeFieldFromForkView('dimensions', f)
                    }}
                />
            })}
        </PillsContainer>
        <PillsContainer>
            {forkView.measures.map((f, fIndex) => {
                const field = meaFields.find(d => d.fid === f);
                return <ViewField
                    type="measure" text={`${(field ? field.name : f) || f}${visualConfig.defaultAggregated ? `(${forkView.ops[fIndex]})` : ''}`}
                    key={f}
                    onRemove={() => {
                        exploreStore.removeFieldFromForkView('measures', f)
                    }}
                />
            })}
        </PillsContainer>
    </div>
}

export default FieldContainer;
