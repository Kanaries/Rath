import { Toggle, Pivot, PivotItem } from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGlobalStore } from '../../../store';
import type { ModifiableBgKnowledge } from '../config';
import { InnerCard } from '../components';
import type { IFieldMeta } from '../../../interfaces';
import type { GraphNodeAttributes } from '../explorer/graph-utils';
import PreconditionTable from './preconditionTable';
import PreconditionGraph from './preconditionGraph';


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
    const { causalStore } = useGlobalStore();
    const { igMatrix, selectedFields } = causalStore;

    const getGeneratedPreconditionsFromExtInfo = useCallback(() => {
        return selectedFields.reduce<ModifiableBgKnowledge[]>((list, f) => {
            if (f.extInfo) {
                for (const from of f.extInfo.extFrom) {
                    list.push({
                        src: from,
                        tar: f.fid,
                        type: 'directed-must-link',
                    });
                }
            }
            return list;
        }, []);
    }, [selectedFields]);

    const getGeneratedPreconditionsFromIGMat = useCallback(() => {
        const initLinks: ModifiableBgKnowledge[] = [];
        const mat = igMatrix;
        // TODO: 临时定的阈值
        const thresholdFalse = 0.005;
        const thresholdMayContainLinearlyIndependency = 0.99; // 线性相关不能反映成因果
        if (mat.length === selectedFields.length) {
            for (let i = 0; i < mat.length; i += 1) {
                for (let j = 0; j < mat.length; j += 1) {
                    if (i === j) {
                        continue;
                    }
                    const wf = mat[i][j];
                    if (wf >= thresholdMayContainLinearlyIndependency) {
                        initLinks.push({
                            src: selectedFields[i].fid,
                            tar: selectedFields[j].fid,
                            type: 'directed-must-not-link',
                        });
                    } else if (wf < thresholdFalse) {
                        initLinks.push({
                            src: selectedFields[i].fid,
                            tar: selectedFields[j].fid,
                            type: 'directed-must-not-link',
                        });
                    }
                }
            }
        }
        return initLinks;
    }, [selectedFields, igMatrix]);

    const [shouldInitPreconditions, setShouldInitPreconditions] = useState(false);
    const shouldInitPreconditionsRef = useRef(shouldInitPreconditions);
    shouldInitPreconditionsRef.current = shouldInitPreconditions;

    useEffect(() => {
        setModifiablePrecondition(
            getGeneratedPreconditionsFromExtInfo().concat(
                shouldInitPreconditionsRef.current ? getGeneratedPreconditionsFromIGMat() : []
            )
        );
    }, [getGeneratedPreconditionsFromExtInfo, getGeneratedPreconditionsFromIGMat, setModifiablePrecondition]);

    const modifiablePreconditionRef = useRef(modifiablePrecondition);
    modifiablePreconditionRef.current = modifiablePrecondition;

    useEffect(() => {
        if (shouldInitPreconditions && modifiablePreconditionRef.current.length === 0) {
            setModifiablePrecondition(
                getGeneratedPreconditionsFromExtInfo().concat(getGeneratedPreconditionsFromIGMat())
            );
        }
    }, [shouldInitPreconditions, getGeneratedPreconditionsFromExtInfo, getGeneratedPreconditionsFromIGMat, setModifiablePrecondition]);

    const [editMode, setEditMode] = useState<EditMode>('diagram');

    return (
        <InnerCard>
            <h1 className="card-header">领域/背景知识</h1>
            <hr className="card-line" />
            <Toggle
                label="使用关联信息初始化"
                checked={shouldInitPreconditions}
                inlineLabel
                onChange={(_, checked) => setShouldInitPreconditions(checked ?? false)}
            />
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
