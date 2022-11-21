import { Pivot, PivotItem } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import type { ModifiableBgKnowledge } from '../config';
import { InnerCard } from '../components';
import type { IFieldMeta } from '../../../interfaces';
import type { GraphNodeAttributes } from '../explorer/graph-utils';
import PreconditionTable from './preconditionTable';
import PreconditionGraph from './preconditionGraph';
import PreconditionBatch from './preconditionBatch';


const EditModes = [{
    itemKey: 'diagram',
    text: '图',
    iconName: 'BranchPullRequest',
}, {
    itemKey: 'matrix',
    text: '矩阵',
    iconName: 'GridViewSmall',
}, {
    itemKey: 'table',
    text: '表',
    iconName: 'BulletedListText',
}] as const;

type EditMode = (typeof EditModes)[number]['itemKey'];
export interface PreconditionPanelProps {
    modifiablePrecondition: ModifiableBgKnowledge[];
    setModifiablePrecondition: (precondition: ModifiableBgKnowledge[] | ((prev: ModifiableBgKnowledge[]) => ModifiableBgKnowledge[])) => void;
    renderNode?: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined;
}

const PreconditionPanel: React.FC<PreconditionPanelProps> = ({
    modifiablePrecondition, setModifiablePrecondition, renderNode,
}) => {
    const [editMode, setEditMode] = useState<EditMode>('diagram');

    return (
        <InnerCard>
            <h1 className="card-header">领域/背景知识</h1>
            <hr className="card-line" />
            <PreconditionBatch
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
            <h2>编辑视图</h2>
            <Pivot
                style={{ marginBottom: '1em' }}
                selectedKey={editMode}
                onLinkClick={(item) => {
                    if (item) {
                        setEditMode(item.props.itemKey as EditMode);
                    }
                }}
            >
                {EditModes.map((item) => {
                    return <PivotItem key={item.itemKey} headerText={item.text} itemKey={item.itemKey} itemIcon={item.iconName} />;
                })}
            </Pivot>
            {{
                diagram: (
                    <PreconditionGraph
                        modifiablePrecondition={modifiablePrecondition}
                        setModifiablePrecondition={setModifiablePrecondition}
                        renderNode={renderNode}
                    />
                ),
                matrix: null,
                table: (
                    <PreconditionTable
                        modifiablePrecondition={modifiablePrecondition}
                        setModifiablePrecondition={setModifiablePrecondition}
                        renderNode={renderNode}
                    />
                ),
            }[editMode]}
        </InnerCard>
    );
};

export default observer(PreconditionPanel);
