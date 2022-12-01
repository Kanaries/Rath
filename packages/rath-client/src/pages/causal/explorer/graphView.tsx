import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { StyledComponentProps } from "styled-components";
import { Graph } from "@antv/g6";
import { observer } from "mobx-react-lite";
import { Dropdown } from "@fluentui/react";
import type { IFieldMeta } from "../../../interfaces";
import type { Subtree } from "../exploration";
import { EdgeAssert } from "../../../store/causalStore/modelStore";
import { useGlobalStore } from "../../../store";
import { GraphNodeAttributes, useGraphOptions, useRenderData } from "./graph-utils";
import { useReactiveGraph } from "./graph-helper";


const sNormalize = (matrix: readonly (readonly number[])[]): number[][] => {
    return matrix.map(vec => vec.map(n => 2 / (1 + Math.exp(-n)) - 1));
};

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
    cutThreshold: number;
    limit: number;
    mode: 'explore' | 'edit';
    onClickNode?: (fid: string | null) => void;
    onLinkTogether: (srcFid: string, tarFid: string, type: EdgeAssert) => void;
    onRevertLink: (srcFid: string, tarFid: string) => void;
    onRemoveLink: (srcFid: string, tarFid: string) => void;
    forceRelayoutRef: React.MutableRefObject<() => void>;
    autoLayout: boolean;
    renderNode?: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined;
    handleLasso?: (fields: IFieldMeta[]) => void;
    handleSubTreeSelected?: (subtree: Subtree | null) => void;
    allowZoom: boolean;
}, never>, 'onChange' | 'ref'>;

const GraphView = forwardRef<HTMLDivElement, GraphViewProps>(({
    onClickNode,
    cutThreshold,
    limit,
    mode,
    onLinkTogether,
    onRevertLink,
    onRemoveLink,
    forceRelayoutRef,
    autoLayout,
    renderNode,
    allowZoom,
    handleLasso,
    handleSubTreeSelected,
    ...props
}, ref) => {
    const { causalStore } = useGlobalStore();
    const { fields } = causalStore;
    const { causality, assertionsAsPag, mutualMatrix } = causalStore.model;

    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    const [createEdgeMode, setCreateEdgeMode] = useState(EdgeAssert.TO_EFFECT);

    const handleLinkTogether = useCallback((srcFid: string, tarFid: string) => {
        onLinkTogether(srcFid, tarFid, createEdgeMode);
    }, [createEdgeMode, onLinkTogether]);

    const weights = useMemo<Map<string, Map<string, number>> | undefined>(() => {
        if (!causality || !mutualMatrix || mutualMatrix.length !== fields.length) {
            return undefined;
        }

        const scoreMatrix = sNormalize(mutualMatrix);

        const map = new Map<string, Map<string, number>>();

        for (const link of causality) {
            const srcIdx = fields.findIndex(f => f.fid === link.src);
            const tarIdx = fields.findIndex(f => f.fid === link.tar);
            if (srcIdx !== -1 && tarIdx !== -1) {
                const w = Math.abs(scoreMatrix[srcIdx][tarIdx]);
                if (!map.has(link.src)) {
                    map.set(link.src, new Map<string, number>());
                }
                map.get(link.src)!.set(link.tar, w);
            }
        }

        return map;
    }, [causality, fields, mutualMatrix]);

    const graphRef = useRef<Graph>();
    const renderData = useRenderData({
        mode,
        fields,
        PAG: mode === 'edit' ? assertionsAsPag : causality ?? [],
        weights: mode === 'edit' ? undefined : weights,
        cutThreshold,
        limit,
        renderNode,
    });
    const cfg = useGraphOptions({
        width,
        fields,
        handleLasso,
        handleLink: handleLinkTogether,
        graphRef,
    });
    const cfgRef = useRef(cfg);
    cfgRef.current = cfg;

    const [forceRelayoutFlag, setForceRelayoutFlag] = useState<0 | 1>(0);
    
    const [clickEdgeMode, setClickEdgeMode] = useState<'delete' | 'forbid'>('forbid');

    const handleEdgeClick = useCallback((edge: { srcFid: string; tarFid: string; } | null) => {
        if (edge) {
            switch (clickEdgeMode) {
                case 'delete': {
                    return onRemoveLink(edge.srcFid, edge.tarFid);
                }
                case 'forbid': {
                    return onRevertLink(edge.srcFid, edge.tarFid);
                }
                default: {
                    break;
                }
            }
        }
    }, [onRevertLink, onRemoveLink, clickEdgeMode]);

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
        forceRelayoutFlag,
        allowZoom,
        handleSubTreeSelected,
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
        >
            <div className="container" ref={containerRef} />
            {mode === 'edit' && (
                <div className="tools">
                    <Dropdown
                        label="连接类型"
                        selectedKey={createEdgeMode}
                        options={[
                            { key: EdgeAssert.TO_EFFECT, text: '单向一定影响' },
                            { key: EdgeAssert.TO_NOT_EFFECT, text: '单向一定不影响' },
                            { key: EdgeAssert.TO_BE_RELEVANT, text: '至少在一个方向存在影响' },
                            { key: EdgeAssert.TO_BE_NOT_RELEVANT, text: '在任意方向一定不影响' },
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
                    <Dropdown
                        label="单击连接行为"
                        selectedKey={clickEdgeMode}
                        options={[
                            { key: 'forbid', text: '禁用此连接' },
                            { key: 'delete', text: '删除约束' },
                        ]}
                        onChange={(_e, option) => {
                            if (!option) {
                                return;
                            }
                            const behaviorType = option.key as typeof clickEdgeMode;
                            setClickEdgeMode(behaviorType);
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
        </Container>
    );
});


export default observer(GraphView);
