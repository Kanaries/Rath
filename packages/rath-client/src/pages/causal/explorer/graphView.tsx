import intl from 'react-intl-universal';
import { forwardRef, useCallback, useEffect, /*useMemo, */useRef, useState } from "react";
import styled, { StyledComponentProps } from "styled-components";
import type { Graph } from "@antv/g6";
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
    const { fields } = causalStore.dataset;
    const { causality, assertionsAsPag } = causalStore.model;
    const viewContext = useCausalViewContext();
    const { explorationKey, layoutMethod, localData } = viewContext ?? {};

    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    const [createEdgeMode, setCreateEdgeMode] = useState(EdgeAssert.TO_EFFECT);

    const handleLinkTogether = useCallback((srcFid: string, tarFid: string) => {
        onLinkTogether(srcFid, tarFid, createEdgeMode);
    }, [createEdgeMode, onLinkTogether]);

    const graphRef = useRef<Graph>();
    const renderData = useRenderData({
        mode,
        PAG: mode === 'edit' ? assertionsAsPag : localData ?? causality ?? [],
    });
    const cfg = useGraphOptions({
        width,
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
                    <ActionButton onClick={() => causalStore.model.clearAssertions()}>
                        {intl.get('causal.analyze.clear_all')}
                    </ActionButton>
                    <Label style={{ marginBlock: '0.1em', fontSize: '90%' }} >{getI18n('chart.tools.edit.settings')}</Label>
                    <Dropdown
                        label={intl.get('causal.analyze.link_mode')}
                        selectedKey={createEdgeMode}
                        options={[
                            { key: EdgeAssert.TO_EFFECT, text: intl.get('causal.analyze.def_to_effect') },
                            { key: EdgeAssert.TO_NOT_EFFECT, text: intl.get('causal.analyze.def_to_not_effect') },
                            { key: EdgeAssert.TO_BE_RELEVANT, text: intl.get('causal.analyze.def_to_be_relevant') },
                            { key: EdgeAssert.TO_BE_NOT_RELEVANT, text: intl.get('causal.analyze.def_to_be_not_relevant') },
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
                        label={intl.get('causal.analyze.click_link_mode')}
                        selectedKey={clickEdgeMode}
                        options={[
                            { key: 'forbid', text: intl.get('causal.analyze.forbid_link') },
                            { key: 'delete', text: intl.get('causal.analyze.delete_link') },
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
                        label={intl.get('causal.analyze.dbl_click_node_mode')}
                        selectedKey={dblClickNodeMode}
                        options={[
                            { key: NodeAssert.FORBID_AS_CAUSE, text: intl.get('causal.analyze.def_forbid_as_cause') },
                            { key: NodeAssert.FORBID_AS_EFFECT, text: intl.get('causal.analyze.def_forbid_as_effect') },
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
