import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Graph } from '@antv/g6';
import produce from 'immer';
import { DefaultButton, Dropdown } from '@fluentui/react';
import styled from 'styled-components';
import { useGlobalStore } from '../../../store';
import type { CausalLink } from '../explorer';
import { useRenderData, useGraphOptions } from '../explorer/graph-utils';
import { useReactiveGraph } from '../explorer/graph-helper';
import type { ModifiableBgKnowledge } from '../config';
import type { PreconditionPanelProps } from './preconditionPanel';


const Container = styled.div`
    height: 600px;
    position: relative;
    > div:first-child {
        width: 100%;
        height: 100%;
    }
    > .tools {
        position: absolute;
        left: 0;
        top: 0;
        padding: 1em;
        flex-grow: 0;
        flex-shrink: 0;
        flex-basis: max-content;
        font-size: 0.8rem;
        opacity: 0.7;
        :hover {
            opacity: 0.95;
        }
    }
`;

const PreconditionGraph: React.FC<PreconditionPanelProps> = ({
    modifiablePrecondition, setModifiablePrecondition, renderNode,
}) => {
    const { __deprecatedCausalStore: causalStore } = useGlobalStore();
    const { selectedFields } = causalStore;

    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    const nodes = useMemo(() => selectedFields.map((f, i) => ({ id: i, fid: f.fid })), [selectedFields]);
    const data = useMemo<{
        nodes: { id: number }[];
        links: { source: number; target: number; type: CausalLink['type'] }[];
    }>(() => ({
        nodes,
        links: [],
    }), [nodes]);

    const [createEdgeMode, setCreateEdgeMode] = useState<ModifiableBgKnowledge['type']>('directed-must-link');
    const onLinkTogether = useCallback((srcFid: string, tarFid: string) => {
        setModifiablePrecondition(list => produce(list, draft => {
            draft.push({
                src: srcFid,
                tar: tarFid,
                type: createEdgeMode,
            });
        }));
    }, [setModifiablePrecondition, createEdgeMode]);
    const onRemoveLink = useCallback((edge: { srcFid: string; tarFid: string; } | null) => {
        if (edge) {
            setModifiablePrecondition(
                list => list.filter(link => [link.src, link.tar].some(fid => ![edge.srcFid, edge.tarFid].includes(fid)))
            );
        }
    }, [setModifiablePrecondition]);

    const graphRef = useRef<Graph>();
    const renderData = useRenderData(data, 'edit', modifiablePrecondition, selectedFields, renderNode);
    const cfg = useGraphOptions(width, selectedFields, undefined, onLinkTogether, graphRef);
    const cfgRef = useRef(cfg);
    cfgRef.current = cfg;

    const [forceUpdateFlag, setUpdateFlag] = useState<1 | 0>(1);

    useReactiveGraph(
        containerRef,
        width,
        graphRef,
        cfg,
        renderData,
        'edit',
        undefined,
        onRemoveLink,
        selectedFields,
        undefined,
        forceUpdateFlag,
        null,
        [],
        false,
    );

    useEffect(() => {
        const { current: container } = containerRef;
        if (container) {
            const cb = () => {
                const { width: w } = container.getBoundingClientRect();
                setWidth(w);
            };
            const ro = new ResizeObserver(cb);
            ro.observe(container);
            return () => {
                ro.disconnect();
            };
        }
    }, []);

    return (
        <Container>
            <div ref={containerRef} />
            <div className="tools">
                <DefaultButton
                    style={{
                        marginBottom: '1em',
                        padding: '0.4em 0',
                        height: 'unset',
                    }}
                    onClick={() => setUpdateFlag(flag => flag ? 0 : 1)}
                    iconProps={{ iconName: 'Repair' }}
                >
                    刷新布局
                </DefaultButton>
                <Dropdown
                    label="连接类型"
                    selectedKey={createEdgeMode}
                    options={[
                        { key: 'directed-must-link', text: '单向一定影响' },
                        { key: 'directed-must-not-link', text: '单向一定不影响' },
                        { key: 'must-link', text: '至少在一个方向存在影响' },
                        { key: 'must-not-link', text: '在任意方向一定不影响' },
                    ]}
                    onChange={(_e, option) => {
                        if (!option) {
                            return;
                        }
                        const linkType = option.key as typeof createEdgeMode;
                        setCreateEdgeMode(linkType);
                    }}
                    styles={{
                        title: {
                            fontSize: '0.8rem',
                            lineHeight: '1.8em',
                            minWidth: '18em',
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
            </div>
        </Container>
    );
};

export default observer(PreconditionGraph);
