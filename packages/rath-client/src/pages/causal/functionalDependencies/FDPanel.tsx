import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import type { IFieldMeta } from '../../../interfaces';
import { useGlobalStore } from '../../../store';
import { IFunctionalDep } from '../config';
import type { GraphNodeAttributes } from '../explorer/graph-utils';
import FDBatch from './FDBatch';
import FDEditor from './FDEditor';


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

export interface FDPanelProps {
    renderNode?: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined;
}

const FDPanel: React.FC<FDPanelProps> = ({ renderNode }) => {
    const { causalStore } = useGlobalStore();
    const { functionalDependencies } = causalStore.model;

    const setFunctionalDependencies = useCallback((
        fdArr: IFunctionalDep[] | ((prev: readonly IFunctionalDep[] | null) => readonly IFunctionalDep[])
    ) => {
        causalStore.model.updateFunctionalDependencies(Array.isArray(fdArr) ? fdArr : fdArr(functionalDependencies));
    }, [causalStore, functionalDependencies]);

    return (
        <Container>
            <FDBatch renderNode={renderNode} />
            <FDEditor
                renderNode={renderNode}
                functionalDependencies={functionalDependencies}
                setFunctionalDependencies={setFunctionalDependencies}
            />
        </Container>
    );
};

export default observer(FDPanel);
