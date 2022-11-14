import {
    ActionButton,
    Dropdown,
    IColumn,
    DetailsList,
    SelectionMode,
} from '@fluentui/react';
import { observer } from 'mobx-react-lite';
import React, { useMemo } from 'react';
import produce from 'immer';
import { useGlobalStore } from '../../store';
import type { ModifiableBgKnowledge } from './config';
import type { PreconditionPanelProps } from './preconditionPanel';


const PreconditionTable: React.FC<PreconditionPanelProps> = ({ modifiablePrecondition, setModifiablePrecondition }) => {
    const { dataSourceStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;

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
                        {fieldMetas.find((f) => f.fid === item.src)?.name ?? item.src}
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
                            //     { key: 'prefer-link', text: 'prefer to link' },
                            // ]}
                            options={[
                                { key: 'must-link', text: '一定相连' },
                                { key: 'must-not-link', text: '一定不相连' },
                                { key: 'prefer-link', text: '有相连倾向' },
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
                minWidth: 140,
                maxWidth: 140,
            },
            {
                key: 'tar',
                name: '因素', //'Target',
                onRender: item => (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {fieldMetas.find((f) => f.fid === item.tar)?.name ?? item.tar}
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
    }, [fieldMetas, setModifiablePrecondition]);

    return (
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
    );
};

export default observer(PreconditionTable);
