import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { StyledComponentProps } from "styled-components";
import { Graph } from "@antv/g6";
import { observer } from "mobx-react-lite";
import { ActionButton, Dropdown } from "@fluentui/react";
import type { IFieldMeta } from "../../../interfaces";
import type { Subtree } from "../exploration";
import { EdgeAssert, NodeAssert } from "../../../store/causalStore/modelStore";
import { useCausalViewContext } from "../../../store/causalStore/viewStore";
import { useGlobalStore } from "../../../store";
import { useGraphOptions, useRenderData } from "./graph-utils";
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
        & * {
            user-select: none;
        }
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
    handleLasso?: (fields: IFieldMeta[]) => void;
    handleSubtreeSelected?: (subtree: Subtree | null) => void;
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
    allowZoom,
    handleLasso,
    handleSubtreeSelected,
    ...props
}, ref) => {
    const { causalStore } = useGlobalStore();
    const { fields } = causalStore;
    const { causality, assertionsAsPag, mutualMatrix } = causalStore.model;
    const { onRenderNode, localWeights } = useCausalViewContext() ?? {};

    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    const [createEdgeMode, setCreateEdgeMode] = useState(EdgeAssert.TO_EFFECT);

    const handleLinkTogether = useCallback((srcFid: string, tarFid: string) => {
        onLinkTogether(srcFid, tarFid, createEdgeMode);
    }, [createEdgeMode, onLinkTogether]);

    const W = useMemo<Map<string, Map<string, number>> | undefined>(() => {
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
        weights: mode === 'edit' ? undefined : localWeights ?? W,
        cutThreshold,
        limit,
        renderNode: onRenderNode,
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

    const [clickEdgeMode, setClickEdgeMode] = useState<'delete' | 'forbid'>('forbid');
    const [dblClickNodeMode, setDblClickNodeMode] = useState(NodeAssert.FORBID_AS_CAUSE);

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

    const handleNodeDblClick = useCallback((fid: string | null) => {
        if (mode === 'edit' && fid) {
            const overload = causalStore.model.assertions.find(decl => 'fid' in decl && decl.fid === fid);
            if (overload?.assertion === dblClickNodeMode) {
                // remove it
                causalStore.model.removeNodeAssertion(fid);
            } else {
                causalStore.model.addNodeAssertion(fid, dblClickNodeMode);
            }
        }
    }, [mode, dblClickNodeMode, causalStore]);

    const graph = useReactiveGraph({
        containerRef,
        width,
        graphRef,
        options: cfg,
        data: renderData,
        mode,
        handleNodeClick: onClickNode,
        handleEdgeClick,
        handleNodeDblClick,
        fields,
        allowZoom,
        handleSubtreeSelected,
    });

    useEffect(() => {
        forceRelayoutRef.current = () => {
            graph.refresh();
        };
        return () => {
            forceRelayoutRef.current = () => {};
        };
    }, [forceRelayoutRef, graph]);

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
                    <ActionButton onClick={() => causalStore.model.clearAssertions()}>
                        清空所有
                    </ActionButton>
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
                    <Dropdown
                        label="双击节点行为"
                        selectedKey={dblClickNodeMode}
                        options={[
                            { key: NodeAssert.FORBID_AS_CAUSE, text: '一定不作为输出' },
                            { key: NodeAssert.FORBID_AS_EFFECT, text: '一定不作为输入' },
                        ]}
                        onChange={(_e, option) => {
                            if (!option) {
                                return;
                            }
                            const assrType = option.key as typeof dblClickNodeMode;
                            setDblClickNodeMode(assrType);
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
