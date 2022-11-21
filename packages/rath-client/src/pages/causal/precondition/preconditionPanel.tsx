import { observer } from 'mobx-react-lite';
import React from 'react';
import type { ModifiableBgKnowledge } from '../config';
import { InnerCard } from '../components';
import type { IFieldMeta } from '../../../interfaces';
import type { GraphNodeAttributes } from '../explorer/graph-utils';
import type { useDataViews } from '../hooks/dataViews';
import PreconditionBatch from './preconditionBatch';
import PreconditionEditor from './preconditionEditor';


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
        <InnerCard>
            <h1 className="card-header">领域/背景知识</h1>
            <hr className="card-line" />
            <PreconditionBatch
                context={context}
                modifiablePrecondition={modifiablePrecondition}
                setModifiablePrecondition={setModifiablePrecondition}
                renderNode={renderNode}
            />
            {/* <Toggle
                label="使用关联信息初始化"
                checked={shouldInitPreconditions}
                inlineLabel
                onChange={(_, checked) => setShouldInitPreconditions(checked ?? false)}
            /> */}
            <PreconditionEditor
                context={context}
                modifiablePrecondition={modifiablePrecondition}
                setModifiablePrecondition={setModifiablePrecondition}
                renderNode={renderNode}
            />
        </InnerCard>
    );
};

export default observer(PreconditionPanel);
