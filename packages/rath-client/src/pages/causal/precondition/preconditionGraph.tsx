import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Graph } from '@antv/g6';
import produce from 'immer';
import styled from 'styled-components';
import { useGlobalStore } from '../../../store';
import type { CausalLink } from '../explorer';
import { useRenderData, useGraphOptions } from '../explorer/graph-utils';
import { useReactiveGraph } from '../explorer/graph-helper';
import type { PreconditionPanelProps } from './preconditionPanel';


const Container = styled.div`
    height: 600px;
`;

const PreconditionGraph: React.FC<PreconditionPanelProps> = ({
    modifiablePrecondition, setModifiablePrecondition, renderNode,
}) => {
    const { dataSourceStore, causalStore } = useGlobalStore();
    const { fieldMetas } = dataSourceStore;
    const { selectedFields } = causalStore;

    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    const nodes = useMemo(() => fieldMetas.map((f, i) => ({ id: i, fid: f.fid })), [fieldMetas]);
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
    const onRemoveLink = useCallback((srcFid: string, tarFid: string) => {
        setModifiablePrecondition(list => list.filter(link => [link.src, link.tar].some(fid => ![srcFid, tarFid].includes(fid))));
    }, [setModifiablePrecondition]);

    const graphRef = useRef<Graph>();
    const renderData = useRenderData(data, 'edit', modifiablePrecondition, fieldMetas, renderNode);
    const cfg = useGraphOptions(width, selectedFields, onLinkTogether, graphRef, undefined);
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
        selectedFields,
        onRemoveLink,
        undefined,
        undefined,
        forceUpdateFlag,
        null,
        [],
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

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const updater = () => {
            setUpdateFlag(flag => flag ? 0 : 1);
            timer = setTimeout(updater, 2_000);
        };
        timer = setTimeout(updater, 2_000);
        return () => {
            clearTimeout(timer);
        };
    }, []);

    return (
        <Container ref={containerRef} />
    );
};

export default observer(PreconditionGraph);
