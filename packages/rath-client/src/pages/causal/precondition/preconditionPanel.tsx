import { observer } from 'mobx-react-lite';
import React from 'react';
import styled from 'styled-components';
import type { ModifiableBgKnowledge } from '../config';
import type { IFieldMeta } from '../../../interfaces';
import type { GraphNodeAttributes } from '../explorer/graph-utils';
import type { useDataViews } from '../hooks/dataViews';
import PreconditionBatch from './preconditionBatch';
import PreconditionEditor from './preconditionEditor';


const Container = styled.div`
    overflow: hidden auto;
    padding: 0.4em 1.6em;
    & h3 {
        font-size: 0.8rem;
        font-weight: 500;
        padding: 0.4em 0;
        :not(:first-child) {
            margin-top: 0.4em;
        }
    }
`;

export interface PreconditionPanelProps {
    context: ReturnType<typeof useDataViews>;
    modifiablePrecondition: ModifiableBgKnowledge[];
    setModifiablePrecondition: (precondition: ModifiableBgKnowledge[] | ((prev: ModifiableBgKnowledge[]) => ModifiableBgKnowledge[])) => void;
    renderNode?: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined;
}

const PreconditionPanel: React.FC<PreconditionPanelProps> = ({
    context, modifiablePrecondition, setModifiablePrecondition, renderNode,
}) => {
    return (
        <Container>
            <PreconditionBatch
                context={context}
                modifiablePrecondition={modifiablePrecondition}
                setModifiablePrecondition={setModifiablePrecondition}
                renderNode={renderNode}
            />
            <PreconditionEditor
                context={context}
                modifiablePrecondition={modifiablePrecondition}
                setModifiablePrecondition={setModifiablePrecondition}
                renderNode={renderNode}
            />
        </Container>
    );
};

export default observer(PreconditionPanel);
