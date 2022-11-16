import {
    ActionButton,
    Dropdown,
    Label,
    Stack,
    Toggle,
} from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGlobalStore } from '../../store';
import type { ModifiableBgKnowledge } from './config';
import { InnerCard } from './components';
import PreconditionTable from './preconditionTable';

export interface PreconditionPanelProps {
    modifiablePrecondition: ModifiableBgKnowledge[];
    setModifiablePrecondition: (precondition: ModifiableBgKnowledge[] | ((prev: ModifiableBgKnowledge[]) => ModifiableBgKnowledge[])) => void;
}

const PreconditionPanel: React.FC<PreconditionPanelProps> = ({ modifiablePrecondition, setModifiablePrecondition }) => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const { igMatrix, selectedFields } = causalStore;

    const [editingPrecondition, setEditingPrecondition] = useState<Partial<ModifiableBgKnowledge>>({
        type: 'must-link',
    });

    useEffect(() => {
        setEditingPrecondition({ type: 'must-link' });
    }, [fieldMetas, causalStore]);

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
                            type: 'must-not-link',
                        });
                    } else if (wf < thresholdFalse) {
                        initLinks.push({
                            src: selectedFields[i].fid,
                            tar: selectedFields[j].fid,
                            type: 'must-not-link',
                        });
                    }
                }
            }
        }
        return [
            ...selectedFields.reduce<ModifiableBgKnowledge[]>((list, f) => {
                if (f.extInfo) {
                    for (const from of f.extInfo.extFrom) {
                        list.push({
                            src: from,
                            tar: f.fid,
                            type: 'must-link',
                        });
                    }
                }
                return list;
            }, []),
            ...initLinks,
        ];
    }, [selectedFields, igMatrix]);

    const [shouldInitPreconditions, setShouldInitPreconditions] = useState(true);
    const shouldInitPreconditionsRef = useRef(shouldInitPreconditions);
    shouldInitPreconditionsRef.current = shouldInitPreconditions;

    useEffect(() => {
        setModifiablePrecondition(shouldInitPreconditionsRef.current ? getGeneratedPreconditionsFromIGMat() : []);
    }, [getGeneratedPreconditionsFromIGMat, setModifiablePrecondition]);

    const modifiablePreconditionRef = useRef(modifiablePrecondition);
    modifiablePreconditionRef.current = modifiablePrecondition;

    useEffect(() => {
        if (shouldInitPreconditions && modifiablePreconditionRef.current.length === 0) {
            setModifiablePrecondition(getGeneratedPreconditionsFromIGMat());
        }
    }, [shouldInitPreconditions, getGeneratedPreconditionsFromIGMat, setModifiablePrecondition]);

    return (
        <InnerCard>
            <h1 className="card-header">领域/背景知识</h1>
            <hr className="card-line" />
            <Stack tokens={{ childrenGap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Toggle
                        label="使用关联信息初始化"
                        checked={shouldInitPreconditions}
                        inlineLabel
                        onChange={(_, checked) => setShouldInitPreconditions(checked ?? false)}
                    />
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Label style={{ width: '20%' }}>添加影响关系</Label>
                        <Dropdown
                            placeholder="Source"
                            selectedKey={editingPrecondition.src ?? 'none'}
                            onChange={(e, option) => {
                                if (!option) {
                                    return;
                                }
                                const fid = option.key as string;
                                setEditingPrecondition((p) => ({
                                    type: p.type,
                                    src: fid,
                                    tar: p.tar === fid ? undefined : p.tar,
                                }));
                            }}
                            options={selectedFields.map((f) => ({
                                key: f.fid,
                                text: f.name ?? f.fid,
                            }))}
                            styles={{ root: { width: '28%', margin: '0 1%' } }}
                        />
                        <Dropdown
                            placeholder="Direction"
                            selectedKey={editingPrecondition.type}
                            onChange={(e, option) => {
                                if (!option) {
                                    return;
                                }
                                setEditingPrecondition((p) => ({
                                    ...p,
                                    type: option.key as typeof p['type'],
                                }));
                            }}
                            options={[
                                { key: 'must-link', text: '一定相连' },
                                { key: 'must-not-link', text: '一定不相连' },
                            ]}
                            styles={{ root: { width: '20%' }, title: { textAlign: 'center' } }}
                        />
                        <Dropdown
                            placeholder="Target"
                            selectedKey={editingPrecondition.tar ?? 'none'}
                            onChange={(e, option) => {
                                if (!option) {
                                    return;
                                }
                                const fid = option.key as string;
                                setEditingPrecondition((p) => ({
                                    type: p.type,
                                    tar: fid,
                                    src: p.src === fid ? undefined : p.src,
                                }));
                            }}
                            options={selectedFields.map((f) => ({
                                key: f.fid,
                                text: f.name ?? f.fid,
                            }))}
                            styles={{ root: { width: '28%', margin: '0 1%' } }}
                        />
                        <ActionButton
                            styles={{
                                root: {
                                    width: '10%',
                                },
                            }}
                            iconProps={{
                                iconName: 'Add',
                            }}
                            onClick={() => {
                                if (
                                    editingPrecondition.src &&
                                    editingPrecondition.tar &&
                                    editingPrecondition.type &&
                                    editingPrecondition.src !== editingPrecondition.tar
                                ) {
                                    setEditingPrecondition({ type: editingPrecondition.type });
                                    setModifiablePrecondition((list) => [
                                        ...list,
                                        editingPrecondition as ModifiableBgKnowledge,
                                    ]);
                                }
                            }}
                        />
                    </div>
                </div>
                <PreconditionTable
                    modifiablePrecondition={modifiablePrecondition}
                    setModifiablePrecondition={setModifiablePrecondition}
                />
            </Stack>
        </InnerCard>
    );
};

export default observer(PreconditionPanel);
