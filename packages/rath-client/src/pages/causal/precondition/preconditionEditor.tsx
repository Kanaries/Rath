import { Pivot, PivotItem } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import PreconditionTable from './preconditionTable';
import PreconditionGraph from './preconditionGraph';
import type { PreconditionPanelProps } from './preconditionPanel';


const EditModes = [{
    itemKey: 'diagram',
    text: '图',
    iconName: 'BranchPullRequest',
}, {
//     itemKey: 'matrix',           // TODO: 实现矩阵编辑
//     text: '矩阵',
//     iconName: 'GridViewSmall',
// }, {
    itemKey: 'table',
    text: '表',
    iconName: 'BulletedListText',
}] as const;

type EditMode = (typeof EditModes)[number]['itemKey'];

const PreconditionEditor: React.FC<PreconditionPanelProps & { title?: string }> = ({
    context, modifiablePrecondition, setModifiablePrecondition, renderNode, title = '编辑视图',
}) => {
    const [editMode, setEditMode] = useState<EditMode>('diagram');

    return (
        <>
            <h3>{title}</h3>
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
                        context={context}
                        modifiablePrecondition={modifiablePrecondition}
                        setModifiablePrecondition={setModifiablePrecondition}
                        renderNode={renderNode}
                    />
                ),
                matrix: null,
                table: (
                    <PreconditionTable
                        context={context}
                        modifiablePrecondition={modifiablePrecondition}
                        setModifiablePrecondition={setModifiablePrecondition}
                        renderNode={renderNode}
                    />
                ),
            }[editMode]}
        </>
    );
};

export default observer(PreconditionEditor);
