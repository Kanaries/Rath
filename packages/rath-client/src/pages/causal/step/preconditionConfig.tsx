import { observer } from 'mobx-react-lite';
import React from 'react';
import { IFieldMeta } from '../../../interfaces';
import { ModifiableBgKnowledge } from '../config';
import type { useDataViews } from '../hooks/dataViews';
import PreconditionPanel from '../precondition/preconditionPanel';
import type { GraphNodeAttributes } from '../explorer/graph-utils';


export interface CausalPreconditionConfigProps {
    dataContext: ReturnType<typeof useDataViews>;
    modifiablePrecondition: ModifiableBgKnowledge[];
    setModifiablePrecondition: (precondition: ModifiableBgKnowledge[] | ((prev: ModifiableBgKnowledge[]) => ModifiableBgKnowledge[])) => void;
    renderNode: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined;
}

const CausalPreconditionConfig: React.FC<CausalPreconditionConfigProps> = ({
    dataContext,
    modifiablePrecondition,
    setModifiablePrecondition,
    renderNode,
}) => {
    return (
        <>
            <PreconditionPanel
                context={dataContext}
                modifiablePrecondition={modifiablePrecondition}
                setModifiablePrecondition={setModifiablePrecondition}
                renderNode={renderNode}
            />
        </>
    );
};

export default observer(CausalPreconditionConfig);
