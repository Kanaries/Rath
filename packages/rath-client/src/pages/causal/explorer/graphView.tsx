import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { StyledComponentProps } from "styled-components";
import { Graph } from "@antv/g6";
import { ActionButton } from "@fluentui/react";
import type { IFieldMeta } from "../../../interfaces";
import type { ModifiableBgKnowledge } from "../config";
import { GraphNodeAttributes, useGraphOptions, useRenderData } from "./graph-utils";
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
    limit: number;
    mode: 'explore' | 'edit';
    focus: number | null;
    onClickNode?: (node: DiagramGraphData['nodes'][number] | null) => void;
    toggleFlowAnalyzer: () => void;
    onLinkTogether: (srcFid: string, tarFid: string) => void;
    onRemoveLink: (srcFid: string, tarFid: string) => void;
    preconditions: ModifiableBgKnowledge[];
    forceRelayoutRef: React.MutableRefObject<() => void>;
    autoLayout: boolean;
    renderNode?: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined;
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

const GraphView = forwardRef<HTMLDivElement, GraphViewProps>(({
    fields,
    selectedSubtree,
    value,
    onClickNode,
    focus,
    cutThreshold,
    limit,
    mode,
    onLinkTogether,
    onRemoveLink,
    preconditions,
    forceRelayoutRef,
    autoLayout,
    renderNode,
    toggleFlowAnalyzer,
    ...props
}, ref) => {
    const [data] = useMemo(() => {
        let totalScore = 0;
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
            })).filter(link => link.value >= cutThreshold).sort((a, b) => b.value - a.value).slice(0, limit),
        }, totalScore];
    }, [value, cutThreshold, limit]);

    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    const updateSelectedRef = useRef<(idx: number) => void>(() => {});

    const [edgeSelected, setEdgeSelected] = useState(false);

    const graphRef = useRef<Graph>();
    const renderData = useRenderData(data, mode, preconditions, fields, renderNode);
    const cfg = useGraphOptions(width, fields, onLinkTogether, graphRef, setEdgeSelected);
    const cfgRef = useRef(cfg);
    cfgRef.current = cfg;

    const [forceRelayoutFlag, setForceRelayoutFlag] = useState<0 | 1>(0);

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
        updateSelectedRef,
        forceRelayoutFlag,
        focus,
        selectedSubtree,
    );

    useEffect(() => {
        const { current: graph } = graphRef;
        if (graph) {
            graph.stopAnimate();
            graph.destroyLayout();
            if (autoLayout) {
                graph.updateLayout(cfgRef.current.layout);
            }
        }
    }, [autoLayout]);

    useEffect(() => {
        forceRelayoutRef.current = () => setForceRelayoutFlag(flag => flag === 0 ? 1 : 0);
        return () => {
            forceRelayoutRef.current = () => {};
        };
    }, [forceRelayoutRef]);

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
            onClick={e => {
                if (e.shiftKey) {
                    toggleFlowAnalyzer();
                }
                e.stopPropagation();
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
