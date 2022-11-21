import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { StyledComponentProps } from "styled-components";
import { Graph } from "@antv/g6";
import { observer } from "mobx-react-lite";
import { ActionButton, Dropdown } from "@fluentui/react";
import type { IFieldMeta } from "../../../interfaces";
import type { ModifiableBgKnowledge } from "../config";
import { useGlobalStore } from "../../../store";
import { GraphNodeAttributes, useGraphOptions, useRenderData } from "./graph-utils";
import { useReactiveGraph } from "./graph-helper";
import type { DiagramGraphData } from ".";


const Container = styled.div`
    overflow: hidden;
    position: relative;
    > div.container {
        width: 100%;
        height: 100%;
    }
    > div.tools {
        position: absolute;
        left: 1em;
        top: 1em;
        padding: 0.8em;
    }
`;

export type GraphViewProps = Omit<StyledComponentProps<'div', {}, {
    selectedSubtree: readonly string[];
    value: Readonly<DiagramGraphData>;
    cutThreshold: number;
    limit: number;
    mode: 'explore' | 'edit';
    focus: number | null;
    onClickNode?: (fid: string | null) => void;
    toggleFlowAnalyzer: () => void;
    onLinkTogether: (srcFid: string, tarFid: string, type: ModifiableBgKnowledge['type']) => void;
    onRevertLink: (srcFid: string, tarFid: string) => void;
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
    selectedSubtree,
    value,
    onClickNode,
    focus,
    cutThreshold,
    limit,
    mode,
    onLinkTogether,
    onRevertLink,
    preconditions,
    forceRelayoutRef,
    autoLayout,
    renderNode,
    toggleFlowAnalyzer,
    ...props
}, ref) => {
    const { causalStore } = useGlobalStore();
    const { selectedFields: fields } = causalStore;

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

    const [createEdgeMode, setCreateEdgeMode] = useState<ModifiableBgKnowledge['type']>('directed-must-link');

    const handleLinkTogether = useCallback((srcFid: string, tarFid: string) => {
        onLinkTogether(srcFid, tarFid, createEdgeMode);
    }, [createEdgeMode, onLinkTogether]);

    const graphRef = useRef<Graph>();
    const renderData = useRenderData(data, mode, preconditions, fields, renderNode);
    const cfg = useGraphOptions(width, fields, handleLinkTogether, graphRef, undefined);
    const cfgRef = useRef(cfg);
    cfgRef.current = cfg;

    const [forceRelayoutFlag, setForceRelayoutFlag] = useState<0 | 1>(0);

    const handleEdgeClick = useCallback((edge: { srcFid: string; tarFid: string; } | null) => {
        if (edge) {
            onRevertLink(edge.srcFid, edge.tarFid);
        }
    }, [onRevertLink]);

    useReactiveGraph(
        containerRef,
        width,
        graphRef,
        cfg,
        renderData,
        mode,
        onClickNode,
        handleEdgeClick,
        fields,
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
            <div className="container" ref={containerRef} />
            {mode === 'edit' && (
                <div className="tools">
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
            )}
            <ExportGraphButton fields={fields} data={value} />
        </Container>
    );
});


export default observer(GraphView);
