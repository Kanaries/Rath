import { RefObject, useEffect, useRef, MutableRefObject, useMemo } from "react";
import G6, { Graph, INode } from "@antv/g6";
import { NodeSelectionMode, useCausalViewContext } from "../../../store/causalStore/viewStore";
import type { Subtree } from "../exploration";
import { PAG_NODE } from "../config";
import type { IFieldMeta } from "../../../interfaces";
import { GRAPH_HEIGHT, useGraphOptions, useRenderData } from "./graph-utils";


export interface IReactiveGraphProps {
    containerRef: RefObject<HTMLDivElement>;
    width: number;
    graphRef: MutableRefObject<Graph | undefined>;
    options: ReturnType<typeof useGraphOptions>;
    data: ReturnType<typeof useRenderData>;
    mode: "explore" | "edit";
    handleNodeClick?: ((fid: string | null) => void) | undefined;
    handleNodeDblClick?: ((fid: string | null) => void) | undefined;
    handleEdgeClick?: ((edge: { srcFid: string, tarFid: string } | null) => void) | undefined;
    fields: readonly IFieldMeta[];
    allowZoom: boolean;
    handleSubtreeSelected?: (subtree: Subtree | null) => void | undefined;
}

export interface IReactiveGraphHandler {
    readonly refresh: () => void;
}

export const useReactiveGraph = ({
    containerRef,
    width,
    graphRef,
    options,
    data,
    mode,
    handleNodeClick,
    handleNodeDblClick,
    handleEdgeClick,
    fields,
    allowZoom,
    handleSubtreeSelected,
}: IReactiveGraphProps): IReactiveGraphHandler => {
    const cfgRef = useRef(options);
    cfgRef.current = options;
    const dataRef = useRef(data);
    dataRef.current = data;
    const handleNodeClickRef = useRef(handleNodeClick);
    handleNodeClickRef.current = handleNodeClick;
    const handleNodeDblClickRef = useRef(handleNodeDblClick);
    handleNodeDblClickRef.current = handleNodeDblClick;
    const fieldsRef = useRef(fields);
    fieldsRef.current = fields;
    const handleEdgeClickRef = useRef(handleEdgeClick);
    handleEdgeClickRef.current = handleEdgeClick;
    const handleSubtreeSelectedRef = useRef(handleSubtreeSelected);
    handleSubtreeSelectedRef.current = handleSubtreeSelected;

    const viewContext = useCausalViewContext();
    const { selectedFieldGroup = [], graphNodeSelectionMode = NodeSelectionMode.NONE } = viewContext ?? {};

    const graphNodeSelectionModeRef = useRef(graphNodeSelectionMode);
    graphNodeSelectionModeRef.current = graphNodeSelectionMode;

    useEffect(() => {
        const { current: container } = containerRef;
        const { current: cfg } = cfgRef;
        if (container && cfg) {
            const graph = new G6.Graph({
                ...cfg,
                container,
            });
            graph.node(node => ({
                label: node.description ?? node.id,
            }));
            graph.data(dataRef.current);
            graph.render();

            graph.on('node:click', (e: any) => {
                const fid = e.item._cfg.id;
                if (typeof fid === 'string') {
                    handleNodeClickRef.current?.(fid);
                } else {
                    handleNodeClickRef.current?.(null);
                }
            });

            graph.on('node:dblclick', (e: any) => {
                const fid = e.item._cfg.id;
                if (typeof fid === 'string') {
                    handleNodeDblClickRef.current?.(fid);
                } else {
                    handleNodeDblClickRef.current?.(null);
                }
            });

            graph.on('edge:click', (e: any) => {
                const edge = e.item;
                if (edge) {
                    const srcFid = (edge._cfg?.source as any)?._cfg.id as string | undefined;
                    const tarFid = (edge._cfg?.target as any)?._cfg.id as string | undefined;
                    if (srcFid && tarFid) {
                        handleEdgeClickRef.current?.({ srcFid, tarFid });
                    } else {
                        handleEdgeClickRef.current?.(null);
                    }
                }
            });

            graphRef.current = graph;

            return () => {
                graphRef.current = undefined;
                container.innerHTML = '';
            };
        }
    }, [containerRef, graphRef]);

    useEffect(() => {
        if (graphRef.current) {
            graphRef.current.changeSize(width, GRAPH_HEIGHT);
            graphRef.current.updateLayout({
                type: 'fruchterman',
                gravity: 5,
                speed: 5,
                center: [width / 2, GRAPH_HEIGHT / 2],
                // for rendering after each iteration
                tick: () => {
                    graphRef.current?.refreshPositions();
                },
            });
            graphRef.current.render();
        }
    }, [width, graphRef]);

    useEffect(() => {
        const { current: graph } = graphRef;
        if (graph) {
            if (mode === 'explore') {
                // It is found that under explore mode,
                // it works strange that the edges are not correctly synchronized with changeData() method,
                // while it's checked that the input data is always right.
                // This unexpected behavior never occurs under edit mode.
                // Fortunately we have data less frequently updated under explore mode,
                // unlike what goes under edit mode, which behaviors well.
                // Thus, this is a reasonable solution to completely reset the layout
                // using read() method (is a combination of data() and render()).
                // If a better solution which always perfectly prevents the unexpected behavior mentioned before,
                // just remove this clause.
                // @author kyusho antoineyang99@gmail.com
                graph.read(data);
            } else {
                graph.changeData(data);
                graph.refresh();
            }
        }
    }, [graphRef, data, mode]);

    useEffect(() => {
        const { current: graph } = graphRef;
        if (graph) {
            graph.data(dataRef.current);
            graph.render();
        }
    }, [graphRef]);

    useEffect(() => {
        const { current: graph } = graphRef;
        if (graph) {
            graph.updateLayout(options);
            graph.render();
        }
    }, [options, graphRef]);

    useEffect(() => {
        const { current: graph } = graphRef;
        if (graph) {
            graph.setMode(`${mode}${allowZoom ? '_zoom' : ''}`);
        }
    }, [mode, graphRef, allowZoom]);

    useEffect(() => {
        const { current: graph } = graphRef;
        if (graph) {
            const focusedNodes = graph.getNodes().filter(node => {
                const fid = node._cfg?.id as string | undefined;
                return fid !== undefined && selectedFieldGroup.some(field => field.fid === fid);
            });
            const subtreeNodes = focusedNodes.reduce<INode[]>((list, focusedNode) => {
                for (const node of graph.getNeighbors(focusedNode)) {
                    if (focusedNodes.some(item => item === node) || list.some(item => item === node)) {
                        continue;
                    }
                    list.push(node);
                }
                return list;
            }, []);
            const subtreeFidArr = subtreeNodes.map(node => {
                return node._cfg?.id as string | undefined;
            }).filter(Boolean) as string[];
            const subtreeFields = subtreeFidArr.reduce<IFieldMeta[]>((list, fid) => {
                const f = fieldsRef.current.find(which => which.fid === fid);
                if (f) {
                    return list.concat([f]);
                }
                return list;
            }, []);
            const subtreeRoot = (
                graphNodeSelectionModeRef.current === NodeSelectionMode.SINGLE && selectedFieldGroup.length === 1
             ) ? selectedFieldGroup[0] : null;
            handleSubtreeSelectedRef.current?.(subtreeRoot ? {
                node: subtreeRoot,
                neighbors: subtreeFields.map(node => ({
                    field: fieldsRef.current.find(f => f.fid === node.fid)!,
                    // FIXME: 查询这条边上的节点状态
                    rootType: PAG_NODE.EMPTY,
                    neighborType: PAG_NODE.EMPTY,
                })),
            } : null);
            graph.getNodes().forEach(node => {
                const isFocused = focusedNodes.some(item => item === node);
                graph.setItemState(node, 'focused', isFocused);
                const isInSubtree = isFocused ? false : subtreeNodes.some(neighbor => neighbor === node);
                graph.setItemState(node, 'highlighted', isInSubtree);
                graph.setItemState(node, 'faded', selectedFieldGroup.length !== 0 && !isFocused && !isInSubtree);
                graph.updateItem(node, {
                    labelCfg: {
                        style: {
                            opacity: focusedNodes.length === 0 ? 1 : isFocused ? 1 : isInSubtree ? 0.5 : 0.2,
                            fontWeight: isFocused ? 600 : 400,
                        },
                    },
                });
            });
            graph.getEdges().forEach(edge => {
                const sourceFid = (edge._cfg?.source as any)?._cfg?.id as string | undefined;
                const targetFid = (edge._cfg?.target as any)?._cfg?.id as string | undefined;
                const nodesSelected = [
                    sourceFid, targetFid
                ].filter(fid => typeof fid === 'string' && selectedFieldGroup.some(f => f.fid === fid));
                const nodesInSubtree = [
                    sourceFid, targetFid
                ].filter(fid => typeof fid === 'string' && subtreeFidArr.some(f => f === fid));
                const isInSubtree = nodesSelected.length === 2;
                const isHalfInSubtree = nodesSelected.length === 1 && nodesInSubtree.length === 1;
                graph.updateItem(edge, {
                    labelCfg: {
                        style: {
                            opacity: isInSubtree ? 1 : isHalfInSubtree ? 0.6 : 0,
                        },
                    },
                });
                graph.setItemState(edge, 'highlighted', isInSubtree);
                graph.setItemState(edge, 'semiHighlighted', isHalfInSubtree);
                graph.setItemState(edge, 'faded', selectedFieldGroup.length !== 0 && !isInSubtree && !isHalfInSubtree);
            });
        }
    }, [graphRef, selectedFieldGroup, data]);

    return useMemo<IReactiveGraphHandler>(() => ({
        refresh() {
            graphRef.current?.read(dataRef.current);
        },
    }), [graphRef]);
};
