import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { StyledComponentProps } from "styled-components";
import { Graph } from "@antv/g6";
import { observer } from "mobx-react-lite";
import { ActionButton, Dropdown, Label } from "@fluentui/react";
import type { IFieldMeta } from "../../../interfaces";
import type { Subtree } from "../submodule";
import { EdgeAssert, NodeAssert } from "../../../store/causalStore/modelStore";
import { ExplorationKey, useCausalViewContext } from "../../../store/causalStore/viewStore";
import { useGlobalStore } from "../../../store";
import { getI18n } from "../locales";
import { useGraphOptions, useRenderData } from "./graph-utils";
import { useReactiveGraph } from "./graph-helper";


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
    weightThreshold: number;
    confThreshold: number;
    limit?: number;
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
    weightThreshold,
    confThreshold,
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
    const { fields, groups } = causalStore.dataset;
    const { causality, assertionsAsPag } = causalStore.model;
    const viewContext = useCausalViewContext();
    const { onRenderNode, /*localWeights, */explorationKey, localData = null, layoutMethod } = viewContext ?? {};

    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    const [createEdgeMode, setCreateEdgeMode] = useState(EdgeAssert.TO_EFFECT);

    const handleLinkTogether = useCallback((srcFid: string, tarFid: string) => {
        onLinkTogether(srcFid, tarFid, createEdgeMode);
    }, [createEdgeMode, onLinkTogether]);

    const thresholds = useMemo(() => {
        return {
            weight: weightThreshold,
            confidence: confThreshold,
        };
    }, [weightThreshold, confThreshold]);

    const graphRef = useRef<Graph>();
    const renderData = useRenderData({
        mode,
        fields,
        groups,
        // TODO: 把「可解释探索」模块的临时 weight 加回来
        // weights: mode === 'edit' || localData ? undefined : localWeights ?? W,
        PAG: mode === 'edit' ? assertionsAsPag : localData?.pag ?? causality ?? [],
        thresholds,
        limit,
        renderNode: onRenderNode,
    });
    const cfg = useGraphOptions({
        width,
        fields,
        layout: layoutMethod,
        handleLasso,
        handleLink: handleLinkTogether,
        graphRef,
    });
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
        if (mode === 'explore') {
            const f = fields.find(which => which.fid === fid);
            if (f) {
                viewContext?.fireEvent('nodeDoubleClick', f);
            }
            return;
        }
        if (mode === 'edit' && fid) {
            const overload = causalStore.model.assertions.find(decl => 'fid' in decl && decl.fid === fid);
            if (overload?.assertion === dblClickNodeMode) {
                // remove it
                causalStore.model.removeNodeAssertion(fid);
            } else {
                causalStore.model.addNodeAssertion(fid, dblClickNodeMode);
            }
        }
    }, [mode, dblClickNodeMode, causalStore, viewContext, fields]);

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
        updatePolicy: explorationKey === ExplorationKey.WHAT_IF ? 'loose' : 'normal',
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
        if (viewContext) {
            viewContext.graph = graph;
            return () => {
                viewContext.graph = null;
            };
        }
    }, [graph, viewContext]);

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
                    {/* <ActionButton onClick={() => causalStore.model.synchronizeAssertionsWithResult()}>
                        编辑因果图覆盖
                    </ActionButton> */}
                    <ActionButton iconProps={{ iconName: 'Delete' }} onClick={() => causalStore.model.clearAssertions()}>
                        {getI18n('chart.tools.edit.clear')}
                    </ActionButton>
                    <Label style={{ marginBlock: '0.1em', fontSize: '90%' }} >{getI18n('chart.tools.edit.settings')}</Label>
                    <Dropdown
                        label={getI18n('chart.assertion.edge')}
                        selectedKey={createEdgeMode}
                        options={[
                            EdgeAssert.TO_EFFECT, EdgeAssert.TO_NOT_EFFECT, EdgeAssert.TO_BE_RELEVANT, EdgeAssert.TO_BE_NOT_RELEVANT
                        ].map((key => ({ key, text: getI18n(`chart.assertion.${key}`) })))}
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
                        label={getI18n('chart.assertion.click_edge')}
                        selectedKey={clickEdgeMode}
                        options={(['forbid', 'delete'] as typeof clickEdgeMode[]).map((key) => ({
                            key, text: getI18n(`chart.assertion.${key}`),
                        }))}
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
                        label={getI18n('chart.assertion.node')}
                        selectedKey={dblClickNodeMode}
                        options={[NodeAssert.FORBID_AS_CAUSE, NodeAssert.FORBID_AS_EFFECT].map((key) => ({
                            key, text: getI18n(`chart.assertion.${key}`)
                        }))}
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
