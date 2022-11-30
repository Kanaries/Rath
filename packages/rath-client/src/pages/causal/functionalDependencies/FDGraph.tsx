import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Graph } from '@antv/g6';
import produce from 'immer';
import { DefaultButton } from '@fluentui/react';
import styled from 'styled-components';
import { useGlobalStore } from '../../../store';
import type { CausalLink } from '../explorer';
import { useRenderData, useGraphOptions } from '../explorer/graph-utils';
import { useReactiveGraph } from '../explorer/graph-helper';
import type { ModifiableBgKnowledge } from '../config';
import type { FDPanelProps } from './FDPanel';


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

const FDGraph: React.FC<FDPanelProps> = ({
    functionalDependencies, setFunctionalDependencies, renderNode,
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

    const onLinkTogether = useCallback((srcFid: string, tarFid: string) => {
        setFunctionalDependencies(list => produce(list, draft => {
            const linked = draft.find(fd => fd.fid === tarFid);
            if (linked && !linked.params.some(prm => prm.fid === srcFid)) {
                linked.params.push({ fid: srcFid });
                if (!linked.func) {
                    linked.func = '<user-defined>';
                } else if (linked.func !== '<user-defined>') {
                    linked.func = '<mixed>';
                }
            } else {
                draft.push({
                    fid: tarFid,
                    params: [{
                        fid: srcFid,
                    }],
                    func: '<user-defined>',
                });
            }
        }));
    }, [setFunctionalDependencies]);

    const onRemoveLink = useCallback((edge: { srcFid: string; tarFid: string; } | null) => {
        if (edge) {
            setFunctionalDependencies(list => produce(list, draft => {
                const linkedIdx = draft.findIndex(fd => fd.fid === edge.tarFid && fd.params.some(prm => prm.fid === edge.srcFid));
                if (linkedIdx !== -1) {
                    const linked = draft[linkedIdx];
                    if (linked.params.length > 1) {
                        linked.params = linked.params.filter(prm => prm.fid !== edge.srcFid);
                        if (linked.func !== '<user-defined>') {
                            linked.func = '<mixed>';
                        }
                    } else {
                        draft.splice(linkedIdx, 1);
                    }
                }
            }));
        }
    }, [setFunctionalDependencies]);

    const conditions = useMemo<ModifiableBgKnowledge[]>(() => {
        return functionalDependencies.reduce<ModifiableBgKnowledge[]>((list, fd) => {
            for (const from of fd.params) {
                list.push({
                    src: from.fid,
                    tar: fd.fid,
                    type: 'directed-must-link',
                });
            }
            return list;
        }, []);
    }, [functionalDependencies]);

    const graphRef = useRef<Graph>();
    const renderData = useRenderData(data, 'edit', conditions, selectedFields, renderNode);
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
            </div>
        </Container>
    );
};

export default observer(FDGraph);
