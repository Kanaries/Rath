import React, { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { useGlobalStore } from '../../../store';
import FieldPlaceholder from '../../../components/fieldPill/fieldPlaceholder';
import ViewField from './viewField';

const PillsContainer = styled.div`
    margin-top: 1em;
    margin-bottom: 1em;
    display: flex;
`;

const FieldContainer: React.FC = (props) => {
    const { megaAutoStore } = useGlobalStore();
    const { mainViewPattern, fieldMetas } = megaAutoStore;

    const appendFieldHandler = useCallback(
        (fid: string) => {
            megaAutoStore.addField2MainViewPattern(fid);
        },
        [megaAutoStore]
    );

    if (mainViewPattern === null) {
        return <div></div>;
    }
    return (
        <div>
            <PillsContainer>
                {mainViewPattern.fields
                    .filter((f) => f.analyticType === 'dimension')
                    .map((f) => {
                        return (
                            <ViewField
                                type="dimension"
                                text={f.name || f.fid}
                                key={f.fid}
                                onRemove={() => {
                                    megaAutoStore.removeFieldInViewPattern(f.fid);
                                }}
                            />
                        );
                    })}
            </PillsContainer>
            <PillsContainer>
                {mainViewPattern.fields
                    .filter((f) => f.analyticType === 'measure')
                    .map((f, fIndex) => {
                        return (
                            <ViewField
                                type="measure"
                                text={`${f.name || f.fid}`}
                                key={f.fid}
                                onRemove={() => {
                                    megaAutoStore.removeFieldInViewPattern(f.fid);
                                }}
                            />
                        );
                    })}
                <FieldPlaceholder fields={fieldMetas} onAdd={appendFieldHandler} />
            </PillsContainer>
        </div>
    );
};

export default observer(FieldContainer);
