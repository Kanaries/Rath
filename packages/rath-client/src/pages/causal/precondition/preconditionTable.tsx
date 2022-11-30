import {
    ActionButton,
    Dropdown,
    IColumn,
    DetailsList,
    SelectionMode,
    Label,
    Stack,
} from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useMemo, useState } from 'react';
import produce from 'immer';
import { useGlobalStore } from '../../../store';
import type { ModifiableBgKnowledge } from '../config';
import type { PreconditionPanelProps } from './preconditionPanel';


const PreconditionTable: React.FC<PreconditionPanelProps> = ({ modifiablePrecondition, setModifiablePrecondition }) => {
    const { __deprecatedCausalStore: causalStore } = useGlobalStore();
    const { selectedFields } = causalStore;

    const [editingPrecondition, setEditingPrecondition] = useState<Partial<ModifiableBgKnowledge>>({
        type: 'must-link',
    });

    useEffect(() => {
        setEditingPrecondition({ type: 'must-link' });
    }, [selectedFields]);

    const preconditionTableCols = useMemo<IColumn[]>(() => {
        return [
            {
                key: 'delete-btn',
                name: '',
                onRender: (item, index) =>
                    typeof index === 'number' ? (
                        <ActionButton
                            styles={{
                                root: {
                                    height: 'unset',
                                    transform: 'scale(0.8)',
                                },
                            }}
                            iconProps={{
                                iconName: 'Clear',
                            }}
                            onClick={() => setModifiablePrecondition((list) => {
                                const next = [...list];
                                next.splice(index, 1);
                                return next;
                            })}
                        />
                    ) : null,
                minWidth: 30,
                maxWidth: 30,
                onRenderHeader: () => (
                    <ActionButton
                        styles={{
                            root: {
                                height: 'unset',
                                transform: 'scale(0.8)',
                            },
                        }}
                        iconProps={{
                            iconName: 'Delete',
                        }}
                        onClick={() => setModifiablePrecondition([])}
                    />
                ),
            },
            {
                key: 'src',
                name: '因素', //'Source',
                onRender: (item) => (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedFields.find((f) => f.fid === item.src)?.name ?? item.src}
                    </span>
                ),
                minWidth: 160,
                maxWidth: 160,
            },
            {
                key: 'type',
                name: '影响约束', //'Constraint',
                onRender: (item: ModifiableBgKnowledge, index) =>
                    typeof index === 'number' ? (
                        <Dropdown
                            selectedKey={item.type}
                            // options={[
                            //     { key: 'must-link', text: 'must link' },
                            //     { key: 'must-not-link', text: 'must not link' },
                            // ]}
                            options={[
                                { key: 'directed-must-link', text: '单向一定影响' },
                                { key: 'directed-must-not-link', text: '单向一定不影响' },
                                { key: 'must-link', text: '至少在一个方向存在影响' },
                                { key: 'must-not-link', text: '在任意方向一定不影响' },
                            ]}
                            onChange={(e, option) => {
                                if (!option) {
                                    return;
                                }
                                const linkType = option.key as typeof item.type;
                                setModifiablePrecondition((p) =>
                                    produce(p, (draft) => {
                                        draft[index].type = linkType;
                                    })
                                );
                            }}
                            styles={{
                                title: {
                                    fontSize: '0.8rem',
                                    lineHeight: '1.8em',
                                    height: '1.8em',
                                    padding: '0 2.8em 0 0.8em',
                                    border: 'none',
                                    borderBottom: '1px solid #8888',
                                },
                                caretDownWrapper: {
                                    fontSize: '0.8rem',
                                    lineHeight: '1.8em',
                                    height: '1.8em',
                                },
                                caretDown: {
                                    fontSize: '0.8rem',
                                    lineHeight: '1.8em',
                                    height: '1.8em',
                                },
                            }}
                        />
                    ) : null,
                minWidth: 200,
                maxWidth: 200,
            },
            {
                key: 'tar',
                name: '因素', //'Target',
                onRender: item => (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedFields.find((f) => f.fid === item.tar)?.name ?? item.tar}
                    </span>
                ),
                minWidth: 160,
                maxWidth: 160,
            },
            {
                key: 'empty',
                name: '',
                onRender: () => <div />,
                minWidth: 0,
            },
        ];
    }, [selectedFields, setModifiablePrecondition]);

    return (
        <Stack tokens={{ childrenGap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                            { key: 'directed-must-link', text: '单向一定影响' },
                            { key: 'directed-must-not-link', text: '单向一定不影响' },
                            { key: 'must-link', text: '至少在一个方向存在影响' },
                            { key: 'must-not-link', text: '在任意方向一定不影响' },
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
            <DetailsList
                items={modifiablePrecondition}
                columns={preconditionTableCols}
                selectionMode={SelectionMode.none}
                styles={{
                    root: {
                        width: 'max-content',
                        maxWidth: '100%',
                        height: '30vh',
                        overflow: 'auto',
                        whiteSpace: 'nowrap',
                        fontSize: '0.8rem',
                    },
                }}
            />
        </Stack>
    );
};

export default observer(PreconditionTable);
