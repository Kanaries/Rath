import { RefObject, useEffect, useRef, MutableRefObject } from "react";
import G6, { Graph } from "@antv/g6";
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
    updateSelectedRef: MutableRefObject<(idx: number) => void> | undefined,
    forceRelayoutFlag: 0 | 1,
    focus: number | null,
    selectedSubtree: readonly string[],
    allowZoom: boolean,
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
                const nodeId = e.item._cfg.id;
                if (typeof nodeId === 'string') {
                    const idx = parseInt(nodeId, 10);
                    handleNodeClickRef.current?.(fieldsRef.current[idx].fid);
                } else {
                    handleNodeClickRef.current?.(null);
                }
            });

            graph.on('edge:click', (e: any) => {
                const edge = e.item;
                if (edge) {
                    const src = (edge._cfg?.source as any)?._cfg.id;
                    const tar = (edge._cfg?.target as any)?._cfg.id;
                    if (src && tar) {
                        const srcF = fieldsRef.current[parseInt(src, 10)];
                        const tarF = fieldsRef.current[parseInt(tar, 10)];
                        handleEdgeClickRef.current?.({ srcFid: srcF.fid, tarFid: tarF.fid });
                    } else {
                        handleEdgeClickRef.current?.(null);
                    }
                }
            });

            if (updateSelectedRef) {
                updateSelectedRef.current = idx => {
                    if (idx === -1) {
                        handleNodeClickRef.current?.(null);
                    }
                };
            }

            graphRef.current = graph;

            return () => {
                graphRef.current = undefined;
                container.innerHTML = '';
            };
        }
    }, [containerRef, graphRef, updateSelectedRef]);

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
                }
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
            graph.refresh();
        }
    }, [options, graphRef]);

    useEffect(() => {
        const { current: container } = containerRef;
        const { current: graph } = graphRef;
        if (container && graph) {
            graph.changeData(data);
            graph.refresh();
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
            graph.getNodes().forEach(node => {
                const id = (() => {
                    try {
                        return parseInt(node._cfg?.id ?? '-1', 10);
                    } catch {
                        return -1;
                    }
                })();
                const isFocused = id === focus;
                graph.setItemState(node, 'focused', isFocused);
                const isInSubtree = selectedSubtree.includes(fieldsRef.current[id]?.fid);
                graph.setItemState(node, 'highlighted', isInSubtree);
                graph.setItemState(node, 'faded', focus !== null && !isFocused && !isInSubtree);
            });
            graph.getEdges().forEach(edge => {
                const sourceIdx = (() => {
                    try {
                        return parseInt((edge._cfg?.source as any)?._cfg?.id ?? '-1', 10);
                    } catch {
                        return -1;
                    }
                })();
                const targetIdx = (() => {
                    try {
                        return parseInt((edge._cfg?.target as any)?._cfg?.id ?? '-1', 10);
                    } catch {
                        return -1;
                    }
                })();
                const isInSubtree = focus !== null && [
                    fieldsRef.current[sourceIdx]?.fid, fieldsRef.current[targetIdx]?.fid
                ].includes(fieldsRef.current[focus]?.fid) && [
                    fieldsRef.current[sourceIdx]?.fid, fieldsRef.current[targetIdx]?.fid
                ].every(fid => {
                    return [fieldsRef.current[focus]?.fid].concat(selectedSubtree).includes(fid);
                });
                graph.setItemState(edge, 'highlighted', isInSubtree);
                graph.setItemState(edge, 'faded', focus !== null && !isInSubtree);
            });
        }
    }, [graphRef, focus, selectedSubtree]);
};
