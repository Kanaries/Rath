import { useMemo, useRef } from "react";
import G6, { Graph, GraphData, GraphOptions } from "@antv/g6";
import type { ModifiableBgKnowledge } from "../config";
import type { IFieldMeta } from "../../../interfaces";
import type { CausalLink } from ".";


export const GRAPH_HEIGHT = 400;

const arrows = {
    undirected: {
        start: '',
        end: '',
    },
    directed: {
        start: '',
        end: 'M 12,0 L 28,8 L 28,-8 Z',
    },
    bidirected: {
        start: 'M 12,0 L 28,8 L 28,-8 Z',
        end: 'M 12,0 L 28,8 L 28,-8 Z',
    },
    'weak directed': {
        start: '',
        end: 'M 12,0 L 18,6 L 24,0 L 18,-6 Z',
    },
} as const;

const G6_EDGE_SELECT = 'edge_select';

G6.registerBehavior(G6_EDGE_SELECT, {
    getEvents() {
        return {
            'edge:click': 'onEdgeClick',
        };
    },
    onEdgeClick(e: any) {
        const graph = this.graph as Graph;
        const item = e.item;
        if (item.hasState('active')) {
            graph.setItemState(item, 'active', false);
            return;
        }
        graph.findAllByState('edge', 'active').forEach(node => {
            graph.setItemState(node, 'active', false);
        });
        graph.setItemState(item, 'active', true);
    },
});

G6.registerEdge(
    'forbidden-edge',
    {
        afterDraw(cfg, group: any) {
            // 获取图形组中的第一个图形，在这里就是边的路径图形
            const shape = group.get('children')[0];
            // 获取路径图形的中点坐标
            const midPoint = shape.getPoint(0.5);
            group.addShape('path', {
                attrs: {
                    width: 10,
                    height: 10,
                    stroke: '#f00',
                    lineWidth: 2,
                    path: [
                        ['M', midPoint.x + 8, midPoint.y + 8],
                        ['L', midPoint.x - 8, midPoint.y - 8],
                        ['M', midPoint.x - 8, midPoint.y + 8],
                        ['L', midPoint.x + 8, midPoint.y - 8],
                    ],
                },
                name: 'forbidden-mark',
            });
        },
        update: undefined,
    },
    'line',
);

export const useRenderData = (
    data: { nodes: { id: number }[]; links: { source: number; target: number; type: CausalLink['type'] }[] },
    mode: "explore" | "edit",
    preconditions: readonly ModifiableBgKnowledge[],
    fields: readonly Readonly<IFieldMeta>[],
    selectedSubtree: readonly string[],
    focus: number | null,
) => {
    return useMemo<GraphData>(() => ({
        nodes: data.nodes.map((node, i) => {
            const isInSubtree = selectedSubtree.includes(fields[node.id].fid);
            return {
                id: `${node.id}`,
                description: fields[i].name ?? fields[i].fid,
                style: {
                    lineWidth: i === focus ? 3 : isInSubtree ? 2 : 1,
                    opacity: i === focus || isInSubtree ? 1 : focus === null ? 1 : 0.4,
                },
            };
        }),
        edges: mode === 'explore' ? data.links.map((link, i) => {
            const isInSubtree = focus !== null && [fields[link.source].fid, fields[link.target].fid].every(fid => {
                return [fields[focus].fid].concat(selectedSubtree).includes(fid);
            });
            return {
                id: `link_${i}`,
                source: `${link.source}`,
                target: `${link.target}`,
                style: {
                    lineWidth: isInSubtree ? 1.5 : 1,
                    opacity: focus === null ? 0.9 : isInSubtree ? 1 : 0.2,
                    startArrow: {
                        fill: '#F6BD16',
                        path: arrows[link.type].start,
                    },
                    endArrow: {
                        fill: '#F6BD16',
                        path: arrows[link.type].end,
                    },
                },
            };
        }) : preconditions.map((bk, i) => ({
            id: `bk_${i}`,
            source: `${fields.findIndex(f => f.fid === bk.src)}`,
            target: `${fields.findIndex(f => f.fid === bk.tar)}`,
            style: {
                lineWidth: 2,
                lineAppendWidth: 5,
                startArrow: {
                    fill: '#F6BD16',
                    path: '',
                },
                endArrow: {
                    fill: '#F6BD16',
                    path: 'M 12,0 L 28,8 L 28,-8 Z',
                },
            },
            edgeStateStyles: {
                active: {
                    lineWidth: 2,
                },
            },
            type: bk.type === 'must-not-link' ? 'forbidden-edge' : undefined,
        })),
    }), [data, mode, preconditions, fields, selectedSubtree, focus]);
};

export const useGraphOptions = (
    width: number,
    fields: readonly Readonly<IFieldMeta>[],
    handleLink: (srcFid: string, tarFid: string) => void,
    graphRef: { current: Graph | undefined },
    setEdgeSelected: (status: boolean) => void,
) => {
    const widthRef = useRef(width);
    widthRef.current = width;
    const fieldsRef = useRef(fields);
    fieldsRef.current = fields;
    const handleLinkRef = useRef(handleLink);
    handleLinkRef.current = handleLink;
    const setEdgeSelectedRef = useRef(setEdgeSelected);
    setEdgeSelectedRef.current = setEdgeSelected;

    return useMemo<Omit<GraphOptions, 'container'>>(() => {
        let createEdgeFrom = -1;
        const cfg: Omit<GraphOptions, 'container'> = {
            width: widthRef.current,
            height: GRAPH_HEIGHT,
            linkCenter: true,
            modes: {
                explore: ['drag-canvas', 'drag-node', 'click-select', 'zoom-canvas'],
                edit: ['drag-canvas', {
                    type: 'create-edge',
                    trigger: 'drag',
                    shouldBegin(e) {
                        const source = e.item?._cfg?.id;
                        if (source) {
                            createEdgeFrom = parseInt(source, 10);
                        }
                        return true;
                    },
                    shouldEnd(e) {
                        if (createEdgeFrom === -1) {
                            return false;
                        }
                        const target = e.item?._cfg?.id;
                        if (target) {
                            const origin = fieldsRef.current[createEdgeFrom];
                            const destination = fieldsRef.current[parseInt(target, 10)];
                            if (origin.fid !== destination.fid) {
                                handleLinkRef.current(origin.fid, destination.fid);
                            }
                        }
                        createEdgeFrom = -1;
                        return false;
                    },
                }, G6_EDGE_SELECT, 'zoom-canvas'],
            },
            animate: true,
            layout: {
                type: 'fruchterman',
                // gravity: 5,
                // speed: 5,
                // center: [widthRef.current / 2, GRAPH_HEIGHT / 2],
                // for rendering after each iteration
                tick: () => {
                    graphRef.current?.refreshPositions();
                },
            },
            defaultNode: {
                size: 24,
                style: {
                    lineWidth: 2,
                },
            },
            defaultEdge: {
                size: 1,
                color: '#F6BD16',
            },
        };
        setEdgeSelectedRef.current(false);
        return cfg;
    }, [graphRef]);
};
