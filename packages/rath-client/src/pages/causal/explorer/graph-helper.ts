import { RefObject, useEffect, useRef, MutableRefObject } from "react";
import G6, { Graph, INode } from "@antv/g6";
import { NodeSelectionMode, useCausalViewContext } from "../../../store/causalStore/viewStore";
import type { Subtree } from "../exploration";
import { PAG_NODE } from "../config";
import type { IFieldMeta } from "../../../interfaces";
import { GRAPH_HEIGHT, useGraphOptions, useRenderData } from "./graph-utils";


export const useReactiveGraph = (
    containerRef: RefObject<HTMLDivElement>,
    width: number,
    graphRef: MutableRefObject<Graph | undefined>,
    options: ReturnType<typeof useGraphOptions>,
    data: ReturnType<typeof useRenderData>,
    mode: "explore" | "edit",
    handleNodeClick: ((fid: string | null) => void) | undefined,
    handleEdgeClick: ((edge: { srcFid: string, tarFid: string } | null) => void) | undefined,
    fields: readonly IFieldMeta[],
    forceRelayoutFlag: 0 | 1,
    allowZoom: boolean,
    handleSubtreeSelected?: (subtree: Subtree | null) => void | undefined,
) => {
    const cfgRef = useRef(options);
    cfgRef.current = options;
    const dataRef = useRef(data);
    dataRef.current = data;
    const handleNodeClickRef = useRef(handleNodeClick);
    handleNodeClickRef.current = handleNodeClick;
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
            graph.data(dataRef.current);
            graph.render();
        }
    }, [forceRelayoutFlag, graphRef]);

    useEffect(() => {
        const { current: graph } = graphRef;
        if (graph) {
            graph.updateLayout(options);
            graph.render();
        }
    }, [options, graphRef]);

    useEffect(() => {
        const { current: container } = containerRef;
        const { current: graph } = graphRef;
        if (container && graph) {
            graph.data(data);
            graph.render();
            (window as any).g = graph;
        }
    }, [data, graphRef, containerRef]);

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
                graph.setItemState(edge, 'faded', selectedFieldGroup.length !== 0 && !isInSubtree);
            });
        }
    }, [graphRef, selectedFieldGroup, data]);
};
