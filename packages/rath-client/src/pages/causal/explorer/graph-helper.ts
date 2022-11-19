import { RefObject, useEffect, useRef, MutableRefObject } from "react";
import G6, { Graph } from "@antv/g6";
import type { IFieldMeta } from "../../../interfaces";
import { GRAPH_HEIGHT, useGraphOptions, useRenderData } from "./graph-utils";
import type { DiagramGraphData } from ".";


export const useReactiveGraph = (
    containerRef: RefObject<HTMLDivElement>,
    width: number,
    graphRef: MutableRefObject<Graph | undefined>,
    options: ReturnType<typeof useGraphOptions>,
    data: ReturnType<typeof useRenderData>,
    mode: "explore" | "edit",
    handleNodeClick: ((node: DiagramGraphData['nodes'][number] | null) => void) | undefined,
    fields: readonly IFieldMeta[],
    handleRemoveLink: (srcFid: string, tarFid: string) => void,
    setEdgeSelected: (status: boolean) => void,
    updateSelectedRef: MutableRefObject<(idx: number) => void>,
    forceRelayoutFlag: 0 | 1,
    focus: number | null,
    selectedSubtree: readonly string[],
) => {
    const cfgRef = useRef(options);
    cfgRef.current = options;
    const dataRef = useRef(data);
    dataRef.current = data;
    const handleNodeClickRef = useRef(handleNodeClick);
    handleNodeClickRef.current = handleNodeClick;
    const fieldsRef = useRef(fields);
    fieldsRef.current = fields;
    const handleRemoveLinkRef = useRef(handleRemoveLink);
    handleRemoveLinkRef.current = handleRemoveLink;
    const setEdgeSelectedRef = useRef(setEdgeSelected);
    setEdgeSelectedRef.current = setEdgeSelected;

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

            graph.on('nodeselectchange', (e: any) => {
                const selected = e.selectedItems.nodes[0]?._cfg.id;
                const idx = selected === undefined ? null : parseInt(selected, 10);

                handleNodeClickRef.current?.(idx === null ? null : { nodeId: idx });
            });

            graph.on('keydown', e => {
                if (e.key === 'Backspace') {
                    // delete selected link
                    const [selectedEdge] = graph.findAllByState('edge', 'active');
                    if (selectedEdge) {
                        const src = (selectedEdge._cfg?.source as any)?._cfg.id;
                        const tar = (selectedEdge._cfg?.target as any)?._cfg.id;
                        if (src && tar) {
                            const srcF = fieldsRef.current[parseInt(src, 10)];
                            const tarF = fieldsRef.current[parseInt(tar, 10)];
                            handleRemoveLinkRef.current(srcF.fid, tarF.fid);
                        }
                    }
                }
            });

            graph.on('click', () => {
                setTimeout(() => {
                    const [selectedEdge] = graph.findAllByState('edge', 'active');
                    setEdgeSelectedRef.current(Boolean(selectedEdge));
                }, 1);
            });

            setEdgeSelectedRef.current(false);

            updateSelectedRef.current = idx => {
                const prevSelected = graph.findAllByState('node', 'selected')[0]?._cfg?.id;
                const prevSelectedIdx = prevSelected ? parseInt(prevSelected, 10) : null;

                if (prevSelectedIdx === idx) {
                    return;
                } else if (prevSelectedIdx !== null) {
                    graph.setItemState(`${prevSelectedIdx}`, 'selected', false);
                } else if (idx !== -1) {
                    graph.setItemState(`${idx}`, 'selected', true);
                }
            };

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
            graph.setMode(mode);
        }
        setEdgeSelectedRef.current(false);
    }, [mode, graphRef]);

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
