import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { StyledComponentProps } from "styled-components";
import { Graph } from "@antv/g6";
import { ActionButton } from "@fluentui/react";
import type { IFieldMeta } from "../../../interfaces";
import type { ModifiableBgKnowledge } from "../config";
import { useGraphOptions, useRenderData } from "./graph-utils";
import { useReactiveGraph } from "./graph-helper";
import type { DiagramGraphData } from ".";


const Container = styled.div`
    overflow: hidden;
    position: relative;
    > div {
        width: 100%;
        height: 100%;
    }
    & .msg {
        position: absolute;
        left: 1em;
        top: 2em;
        font-size: 10px;
        user-select: none;
        pointer-events: none;
    }
`;

export type GraphViewProps = Omit<StyledComponentProps<'div', {}, {
    fields: readonly Readonly<IFieldMeta>[];
    selectedSubtree: readonly string[];
    value: Readonly<DiagramGraphData>;
    cutThreshold: number;
    mode: 'explore' | 'edit';
    focus: number | null;
    onClickNode?: (node: DiagramGraphData['nodes'][number]) => void;
    onLinkTogether: (srcFid: string, tarFid: string) => void;
    onRemoveLink: (srcFid: string, tarFid: string) => void;
    preconditions: ModifiableBgKnowledge[];
}, never>, 'onChange' | 'ref'>;

/** 调试用的，不需要的时候干掉 */
type ExportableGraphData = {
    nodes: { id: string }[];
    edges: { source: string; target: string }[];
};
/** 调试用的，不需要的时候干掉 */
const ExportGraphButton: React.FC<{ data: DiagramGraphData; fields: readonly Readonly<IFieldMeta>[] }> = ({ data, fields }) => {
    const value = useMemo<File>(() => {
        const graph: ExportableGraphData = {
            nodes: fields.map(f => ({ id: f.fid })),
            edges: [],
        };
        for (const link of data.links) {
            const source = fields[link.causeId].fid;
            const target = fields[link.effectId].fid;
            graph.edges.push({ source, target });
            if (link.type === 'bidirected' || link.type === 'undirected') {
                graph.edges.push({ source: target, target: source });
            }
        }
        return new File([JSON.stringify(graph, undefined, 2)], `test - ${new Date().toLocaleString()}.json`);
    }, [data, fields]);
    const dataUrlRef = useRef('');
    useEffect(() => {
        dataUrlRef.current = URL.createObjectURL(value);
        return () => {
            URL.revokeObjectURL(dataUrlRef.current);
        };
    }, [value]);
    const handleExport = useCallback(() => {
        const a = document.createElement('a');
        a.href = dataUrlRef.current;
        a.download = value.name;
        a.click();
        a.remove();
    }, [value.name]);
    return (
        <ActionButton iconProps={{ iconName: 'Download' }} onClick={handleExport} style={{ position: 'absolute', bottom: 0 }}>
            导出为图
        </ActionButton>
    );
};

const GraphView = forwardRef<HTMLDivElement, GraphViewProps>((
    { fields, selectedSubtree, value, onClickNode, focus, cutThreshold, mode, onLinkTogether, onRemoveLink, preconditions, ...props },
    ref
) => {
    const [forceUpdateFlag, setForceUpdateFlag] = useState(Date.now());

    const [data] = useMemo(() => {
        let totalScore = 0;
        const pos = forceUpdateFlag;
        const nodeCauseWeights = value.nodes.map(() => 0);
        const nodeEffectWeights = value.nodes.map(() => 0);
        value.links.forEach(link => {
            nodeCauseWeights[link.effectId] += link.score;
            nodeEffectWeights[link.causeId] += link.score;
            totalScore += link.score * 2;
        });
        return [{
            nodes: value.nodes.map((node, i) => ({
                id: node.nodeId,
                index: i,
                causeSum: nodeCauseWeights[i],
                effectSum: nodeEffectWeights[i],
                score: (nodeCauseWeights[i] + nodeEffectWeights[i]) / totalScore,
                diff: (nodeCauseWeights[i] - nodeEffectWeights[i]) / totalScore,
            })),
            links: value.links.map(link => ({
                source: link.causeId,
                target: link.effectId,
                value: link.score / nodeCauseWeights[link.effectId],
                type: link.type,
            })).filter(link => link.value >= cutThreshold),
        }, totalScore, pos];
    }, [value, cutThreshold, forceUpdateFlag]);

    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    const updateSelectedRef = useRef<(idx: number) => void>(() => {});

    const [edgeSelected, setEdgeSelected] = useState(false);

    const graphRef = useRef<Graph>();
    const renderData = useRenderData(data, mode, preconditions, fields, selectedSubtree, focus);
    const cfg = useGraphOptions(width, fields, onLinkTogether, graphRef, setEdgeSelected);

    useReactiveGraph(
        containerRef,
        width,
        graphRef,
        cfg,
        renderData,
        mode,
        onClickNode,
        fields,
        onRemoveLink,
        setEdgeSelected,
        updateSelectedRef
    );

    useEffect(() => {
        if (focus !== null) {
            updateSelectedRef.current(focus);
        }
    }, [focus]);

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
        <Container
            {...props}
            ref={ref}
            onClick={e => e.stopPropagation()}
            onDoubleClick={e => {
                e.stopPropagation();
                setForceUpdateFlag(Date.now());
            }}
        >
            <div ref={containerRef} />
            {/* {edgeSelected && <p className="msg">Press Backspace key to remove this edge.</p>} */}
            {edgeSelected && <p className="msg">按下 Backspace 键删除这条关系</p>}
            <ExportGraphButton fields={fields} data={value} />
        </Container>
    );
});


export default GraphView;
