import { observer } from 'mobx-react-lite';
import React, { useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { useGlobalStore } from '../../../store';
import { mergeCausalPag } from '../../../utils/resolve-causal';
import ManualAnalyzer from '../manualAnalyzer';
import Floating from '../floating';
import { CausalExplorer, CausalModalProps } from './causalModel';


const Container = styled.div`
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

export type CausalExplorationProps = CausalModalProps;

const CausalExploration: React.FC<CausalExplorationProps> = ({
    dataContext,
    modifiablePrecondition,
    setModifiablePrecondition,
    interactFieldGroups,
    renderNode,
}) => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const { causalStrength } = causalStore;

    useEffect(() => {
        causalStore.updateCausalAlgorithmList(fieldMetas);
    }, [causalStore, fieldMetas]);

    const resetExploringFieldsRef = useRef(() => interactFieldGroups.clearFieldGroup());
    resetExploringFieldsRef.current = () => interactFieldGroups.clearFieldGroup();

    useEffect(() => {
        resetExploringFieldsRef.current();
    }, [causalStrength]);

    const edges = useMemo(() => {
        return mergeCausalPag(causalStrength, modifiablePrecondition, fieldMetas);
    }, [causalStrength, fieldMetas, modifiablePrecondition]);

    return (
        <Container>
            <ManualAnalyzer context={dataContext} interactFieldGroups={interactFieldGroups} edges={edges} />
            <Floating
                style={{
                    width: '60vw',
                    minWidth: '720px',
                }}
            >
                <CausalExplorer
                    allowEdit={false}
                    dataContext={dataContext}
                    modifiablePrecondition={modifiablePrecondition}
                    setModifiablePrecondition={setModifiablePrecondition}
                    renderNode={renderNode}
                    interactFieldGroups={interactFieldGroups}
                />
            </Floating>
        </Container>
    );
};

export default observer(CausalExploration);
