import { observer } from 'mobx-react-lite';
import React from 'react';
import styled from 'styled-components';
import type { IFunctionalDep } from '../config';
import type { IFieldMeta } from '../../../interfaces';
import type { GraphNodeAttributes } from '../explorer/graph-utils';
import type { useDataViews } from '../hooks/dataViews';
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
    context: ReturnType<typeof useDataViews>;
    functionalDependencies: IFunctionalDep[];
    setFunctionalDependencies: (fdArr: IFunctionalDep[] | ((prev: IFunctionalDep[]) => IFunctionalDep[])) => void;
    renderNode?: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined;
}

const FDPanel: React.FC<FDPanelProps> = ({
    context, functionalDependencies, setFunctionalDependencies, renderNode,
}) => {
    return (
        <Container>
            <FDBatch
                context={context}
                functionalDependencies={functionalDependencies}
                setFunctionalDependencies={setFunctionalDependencies}
                renderNode={renderNode}
            />
            <FDEditor
                context={context}
                functionalDependencies={functionalDependencies}
                setFunctionalDependencies={setFunctionalDependencies}
                renderNode={renderNode}
            />
        </Container>
    );
};

export default observer(FDPanel);
