import { useMemo, useRef, CSSProperties } from "react";
import G6, { Graph, GraphData, GraphOptions } from "@antv/g6";
import { PagLink, PAG_NODE } from "../config";
import type { IFieldMeta } from "../../../interfaces";


export const GRAPH_HEIGHT = 500;

export type GraphNodeAttributes<
    T extends 'circle' | 'rect' | 'ellipse' | 'diamond' | 'triangle' | 'star' | 'image' | 'modelRect' | 'donut' = 'circle'
> = Partial<{
    /** https://antv-g6.gitee.io/zh/docs/manual/middle/elements/nodes/defaultNode#%E5%86%85%E7%BD%AE%E8%8A%82%E7%82%B9%E7%B1%BB%E5%9E%8B%E8%AF%B4%E6%98%8E */
    type: T;
    style: Partial<{
        size: T extends 'circle' ? number : never;
        label: T extends 'circle' ? string : never;
        fill: string;
        stroke: string;
        lineWidth: number;
        lineDash: number[];
        shadowColor: string;
        shadowBlur: number;
        shadowOffsetX: number;
        shadowOffsetY: number;
        opacity: number;
        fillOpacity: number;
        cursor: CSSProperties['cursor'];
    }>;
}>;

const arrows = {
    [PAG_NODE.EMPTY]: '',
    [PAG_NODE.BLANK]: '',
    [PAG_NODE.ARROW]: 'M 8.4,0 L 19.6,5.6 L 19.6,-5.6 Z',
    [PAG_NODE.CIRCLE]: 'M 8.4,0 a 5.6,5.6 0 1,0 11.2,0 a 5.6,5.6 0 1,0 -11.2,0 Z',
} as const;

export const ForbiddenEdgeType = 'forbidden-edge';

G6.registerEdge(
    ForbiddenEdgeType,
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
                    stroke: '#c50f1f',
                    lineWidth: 2,
                    path: [
                        ['M', midPoint.x + 6, midPoint.y + 6],
                        ['L', midPoint.x - 6, midPoint.y - 6],
                        ['M', midPoint.x - 6, midPoint.y + 6],
                        ['L', midPoint.x + 6, midPoint.y - 6],
                    ],
                },
                name: 'forbidden-mark',
            });
        },
        update: undefined,
    },
    'line',
);

export interface IRenderDataProps {
    mode: "explore" | "edit";
    fields: readonly Readonly<IFieldMeta>[];
    PAG: readonly PagLink[];
    /** @default undefined */
    weights?: Map<string, Map<string, number>> | undefined;
    /** @default 0 */
    cutThreshold?: number;
    /** @default Infinity */
    limit?: number;
    renderNode?: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined,
}

export const useRenderData = ({
    mode,
    fields,
    PAG,
    weights = undefined,
    cutThreshold = 0,
    limit = Infinity,
    renderNode,
}: IRenderDataProps) => {
    return useMemo<GraphData>(() => ({
        nodes: fields.map((f) => {
            return {
                id: `${f.fid}`,
                description: f.name ?? f.fid,
                ...renderNode?.(f),
            };
        }),
        edges: mode === 'explore' ? PAG.filter(link => {
            const w = weights?.get(link.src)?.get(link.tar);
            return w === undefined || w >= cutThreshold;
        }).slice(0, limit).map((link, i) => {
            const w = weights?.get(link.src)?.get(link.tar);

            return {
                id: `link_${i}`,
                source: link.src,
                target: link.tar,
                style: {
                    startArrow: {
                        fill: '#F6BD16',
                        path: arrows[link.src_type],
                    },
                    endArrow: {
                        fill: '#F6BD16',
                        path: arrows[link.tar_type],
                    },
                    lineWidth: typeof w === 'number' ? 1 + w * 2 : undefined,
                },
                label: typeof w === 'number' ? `${(w * 100).toFixed(2).replace(/\.?0+$/, '')}%` : undefined,
                labelCfg: {
                    style: {
                        opacity: 0,
                    },
                },
            };
        }) : PAG.map((assr, i) => {
            const isForbiddenType = [assr.src_type, assr.tar_type].includes(PAG_NODE.EMPTY);
            const color = isForbiddenType ? '#c50f1f' : '#0027b4';

            return {
                id: `bk_${i}`,
                source: assr.src,
                target: assr.tar,
                style: {
                    lineWidth: 2,
                    lineAppendWidth: 5,
                    stroke: color,
                    startArrow: {
                        fill: color,
                        stroke: color,
                        path: arrows[assr.src_type],
                    },
                    endArrow: {
                        fill: color,
                        stroke: color,
                        path: arrows[assr.tar_type],
                    },
                },
                type: isForbiddenType ? ForbiddenEdgeType : undefined,
            };
        }),
    }), [fields, mode, PAG, limit, renderNode, weights, cutThreshold]);
};

export interface IGraphOptions {
    width: number;
    fields: readonly Readonly<IFieldMeta>[];
    handleLasso?: ((fields: IFieldMeta[]) => void) | undefined;
    handleLink?: (srcFid: string, tarFid: string) => void | undefined;
    graphRef: { current: Graph | undefined };
}

export const useGraphOptions = ({
    width,
    fields,
    handleLasso,
    handleLink,
    graphRef,
}: IGraphOptions) => {
    const widthRef = useRef(width);
    widthRef.current = width;
    const fieldsRef = useRef(fields);
    fieldsRef.current = fields;
    const handleLassoRef = useRef(handleLasso);
    handleLassoRef.current = handleLasso;
    const handleLinkRef = useRef(handleLink);
    handleLinkRef.current = handleLink;

    return useMemo<Omit<GraphOptions, 'container'>>(() => {
        let createEdgeFrom: string | null = null;
        const exploreMode = ['drag-canvas', 'drag-node', {
            type: 'lasso-select',
            trigger: 'shift',
            onSelect(nodes: any, edges: any) {
                const selected: IFieldMeta[] = [];
                for (const node of nodes) {
                    const fid = node._cfg?.id as string | undefined;
                    if (fid) {
                        const f = fieldsRef.current.find(which => which.fid === fid);
                        if (f) {
                            selected.push(f);
                        }
                    }
                    graphRef.current?.setItemState(node, 'selected', false);
                }
                for (const edge of edges) {
                    graphRef.current?.setItemState(edge, 'selected', false);
                }
                handleLassoRef.current?.(selected);
            },
        }];
        const editMode = ['drag-canvas', {
            type: 'create-edge',
            trigger: 'drag',
            shouldBegin(e: any) {
                const sourceFid = e.item?._cfg?.id as string | undefined;
                if (sourceFid) {
                    createEdgeFrom = sourceFid;
                }
                return true;
            },
            shouldEnd(e: any) {
                if (createEdgeFrom === null) {
                    return false;
                }
                const targetFid = e.item?._cfg?.id as string | undefined;
                if (targetFid) {
                    if (createEdgeFrom !== targetFid) {
                        handleLinkRef.current?.(createEdgeFrom, targetFid);
                    }
                }
                createEdgeFrom = null;
                return false;
            },
        }];
        const cfg: Omit<GraphOptions, 'container'> = {
            width: widthRef.current,
            height: GRAPH_HEIGHT,
            linkCenter: true,
            modes: {
                explore: exploreMode,
                explore_zoom: [...exploreMode, 'zoom-canvas'],
                edit: editMode,
                edit_zoom: [...exploreMode, 'zoom-canvas'],
            },
            animate: true,
            layout: {
                type: 'fruchterman',
                // https://antv-g6.gitee.io/zh/docs/api/graphLayout/fruchterman#layoutcfggpuenabled
                // 启用 GPU 加速会导致数据更新时视图变化很大
                gpuEnabled: false,
                speed: 1,
                // for rendering after each iteration
                tick: () => {
                    graphRef.current?.refreshPositions();
                },
            },
            defaultNode: {
                size: 20,
                style: {
                    lineWidth: 1,
                },
            },
            nodeStateStyles: {
                focused: {
                    lineWidth: 1.5,
                    opacity: 1,
                    shadowColor: '#F6BD16',
                    shadowBlur: 8,
                },
                highlighted: {
                    opacity: 0.4,
                },
                faded: {
                    opacity: 0.2,
                },
            },
            defaultEdge: {
                size: 1,
                color: '#F6BD16',
                opacity: 0.9,
            },
            edgeStateStyles: {
                highlighted: {
                    opacity: 1,
                },
                semiHighlighted: {
                    opacity: 0.8,
                },
                faded: {
                    opacity: 0.12,
                },
            },
        };
        return cfg;
    }, [graphRef]);
};
