import { RefObject, useEffect, useRef, MutableRefObject, useMemo } from "react";
import { Graph } from "@antv/g6";
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
            const graph = new Graph({
                ...cfg,
                container,
            });
            
            // Set data and render
            graph.setData(dataRef.current);
            graph.render();

            graph.on('node:click', (e: any) => {
                const fid = e.itemId as string | undefined;
                if (typeof fid === 'string') {
                    handleNodeClickRef.current?.(fid);
                } else {
                    handleNodeClickRef.current?.(null);
                }
            });

            graph.on('node:dblclick', (e: any) => {
                const fid = e.itemId as string | undefined;
                if (typeof fid === 'string') {
                    handleNodeDblClickRef.current?.(fid);
                } else {
                    handleNodeDblClickRef.current?.(null);
                }
            });

            graph.on('edge:click', (e: any) => {
                const edge = e.itemId;
                if (edge) {
                    // Get edge data to find source and target
                    const edgeData = graph.getEdgeData(edge);
                    if (edgeData) {
                        const srcFid = edgeData.source as string | undefined;
                        const tarFid = edgeData.target as string | undefined;
                        if (srcFid && tarFid) {
                            handleEdgeClickRef.current?.({ srcFid, tarFid });
                        } else {
                            handleEdgeClickRef.current?.(null);
                        }
                    }
                } else {
                    handleEdgeClickRef.current?.(null);
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
            graphRef.current.setSize(width, GRAPH_HEIGHT);
            graphRef.current.setLayout({
                type: 'fruchterman',
                gravity: 5,
                speed: 5,
                center: [width / 2, GRAPH_HEIGHT / 2],
                // for rendering after each iteration
                tick: () => {
                    graphRef.current?.render();
                },
            });
            graphRef.current.render();
        }
    }, [width, graphRef]);

    useEffect(() => {
        const { current: graph } = graphRef;
        if (graph) {
            // Always use setData + render for G6 v5
            graph.setData(data);
            graph.render();
        }
    }, [graphRef, data, mode]);

    useEffect(() => {
        const { current: graph } = graphRef;
        if (graph) {
            graph.setData(dataRef.current);
            graph.render();
        }
    }, [graphRef]);

    useEffect(() => {
        const { current: graph } = graphRef;
        if (graph) {
            // Update behaviors based on mode and zoom
            const newBehaviors = mode === 'explore' 
                ? (allowZoom ? ['drag-canvas', 'drag-element', 'zoom-canvas'] : ['drag-canvas', 'drag-element'])
                : (allowZoom ? ['drag-canvas', 'create-edge', 'zoom-canvas'] : ['drag-canvas', 'create-edge']);
            
            graph.setBehaviors(newBehaviors);
        }
    }, [mode, graphRef, allowZoom]);

    useEffect(() => {
        const { current: graph } = graphRef;
        if (graph) {
            const nodeData = graph.getNodeData();
            const edgeData = graph.getEdgeData();
            const nodeIds = nodeData.map((node: any) => node.id);
            const edgeIds = edgeData.map((edge: any) => edge.id);
            
            const focusedNodeIds = nodeIds.filter((nodeId: string) => {
                return selectedFieldGroup.some(field => field.fid === nodeId);
            });
            
            const subtreeNodeIds: string[] = [];
            focusedNodeIds.forEach((focusedNodeId: string) => {
                const neighbors = graph.getNeighborNodesData(focusedNodeId);
                neighbors.forEach((neighbor: any) => {
                    if (!focusedNodeIds.includes(neighbor.id) && !subtreeNodeIds.includes(neighbor.id)) {
                        subtreeNodeIds.push(neighbor.id);
                    }
                });
            });
            
            const subtreeFields = subtreeNodeIds.reduce<IFieldMeta[]>((list, nodeId) => {
                const f = fieldsRef.current.find(which => which.fid === nodeId);
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
            
            // Update node states
            nodeIds.forEach((nodeId: string) => {
                const isFocused = focusedNodeIds.includes(nodeId);
                const isInSubtree = !isFocused && subtreeNodeIds.includes(nodeId);
                const isFaded = selectedFieldGroup.length !== 0 && !isFocused && !isInSubtree;
                
                const states = [];
                if (isFocused) states.push('focused');
                if (isInSubtree) states.push('highlighted');
                if (isFaded) states.push('faded');
                
                graph.setElementState(nodeId, states);
            });
            
            // Update edge states
            edgeIds.forEach((edgeId: string) => {
                const edgeData = graph.getEdgeData(edgeId);
                if (!edgeData) return;
                
                const sourceFid = edgeData.source as string;
                const targetFid = edgeData.target as string;
                
                const nodesSelected = [sourceFid, targetFid].filter(fid => 
                    selectedFieldGroup.some(f => f.fid === fid)
                ).length;
                
                const nodesInSubtree = [sourceFid, targetFid].filter(fid => 
                    subtreeNodeIds.includes(fid)
                ).length;
                
                const isInSubtree = nodesSelected === 2;
                const isHalfInSubtree = nodesSelected === 1 && nodesInSubtree === 1;
                const isFaded = selectedFieldGroup.length !== 0 && !isInSubtree && !isHalfInSubtree;
                
                const states = [];
                if (isInSubtree) states.push('highlighted');
                if (isHalfInSubtree) states.push('semiHighlighted');
                if (isFaded) states.push('faded');
                
                graph.setElementState(edgeId, states);
            });
        }
    }, [graphRef, selectedFieldGroup, data]);

    return useMemo<IReactiveGraphHandler>(() => ({
        refresh() {
            if (graphRef.current) {
                graphRef.current.setData(dataRef.current);
                graphRef.current.render();
            }
        },
    }), [graphRef]);
};
