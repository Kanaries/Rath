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
import type { PreconditionPanelProps } from './preconditionPanel';


const Container = styled.div`
    height: 600px;
    position: relative;
    > div {
        width: 100%;
        height: 100%;
    }
    > button {
        position: absolute;
        bottom: 1em;
        left: 1em;
    }
`;

const PreconditionGraph: React.FC<PreconditionPanelProps> = ({
    modifiablePrecondition, setModifiablePrecondition, renderNode,
}) => {
    const { causalStore } = useGlobalStore();
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
        setModifiablePrecondition(list => produce(list, draft => {
            draft.push({
                src: srcFid,
                tar: tarFid,
                type: 'directed-must-link',
            });
        }));
    }, [setModifiablePrecondition]);
    const onRemoveLink = useCallback((edge: { srcFid: string; tarFid: string; } | null) => {
        if (edge) {
            setModifiablePrecondition(
                list => list.filter(link => [link.src, link.tar].some(fid => ![edge.srcFid, edge.tarFid].includes(fid)))
            );
        }
    }, [setModifiablePrecondition]);

    const graphRef = useRef<Graph>();
    const renderData = useRenderData(data, 'edit', modifiablePrecondition, selectedFields, renderNode);
    const cfg = useGraphOptions(width, selectedFields, onLinkTogether, graphRef);
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
            <DefaultButton
                style={{
                    flexGrow: 0,
                    flexShrink: 0,
                    flexBasis: 'max-content',
                    padding: '0.4em 0',
                }}
                onClick={() => setUpdateFlag(flag => flag ? 0 : 1)}
            >
                修正布局
            </DefaultButton>
        </Container>
    );
};

export default observer(PreconditionGraph);
