import { useMemo, useRef, CSSProperties } from "react";
import { Graph, register, ExtensionCategory, Line } from "@antv/g6";
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

// TODO: Implement custom forbidden edge for G6 v5
// Currently using basic edge type until proper implementation
// Custom edge registration will need to be revisited with proper G6 v5 API

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
    return useMemo(() => ({
        nodes: fields.map((f) => {
            const nodeConfig = renderNode?.(f);
            return {
                id: `${f.fid}`,
                data: {
                    description: f.name ?? f.fid,
                },
                style: {
                    size: nodeConfig?.style?.size || 20,
                    fill: nodeConfig?.style?.fill,
                    stroke: nodeConfig?.style?.stroke,
                    lineWidth: nodeConfig?.style?.lineWidth || 1,
                    lineDash: nodeConfig?.style?.lineDash,
                    shadowColor: nodeConfig?.style?.shadowColor,
                    shadowBlur: nodeConfig?.style?.shadowBlur,
                    shadowOffsetX: nodeConfig?.style?.shadowOffsetX,
                    shadowOffsetY: nodeConfig?.style?.shadowOffsetY,
                    opacity: nodeConfig?.style?.opacity,
                    fillOpacity: nodeConfig?.style?.fillOpacity,
                    ...(nodeConfig?.style?.cursor ? { cursor: 'pointer' } : {}),
                },
                type: nodeConfig?.type,
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
                data: {
                    label: typeof w === 'number' ? `${(w * 100).toFixed(2).replace(/\.?0+$/, '')}%` : undefined,
                },
                style: {
                    startArrow: arrows[link.src_type] ? {
                        d: arrows[link.src_type],
                        fill: '#F6BD16',
                    } : undefined,
                    endArrow: arrows[link.tar_type] ? {
                        d: arrows[link.tar_type],
                        fill: '#F6BD16',
                    } : undefined,
                    lineWidth: typeof w === 'number' ? 1 + w * 2 : undefined,
                    labelOpacity: 0,
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
                    lineDash: isForbiddenType ? [5, 5] : undefined,
                    startArrow: arrows[assr.src_type] ? {
                        d: arrows[assr.src_type],
                        fill: color,
                        stroke: color,
                    } : undefined,
                    endArrow: arrows[assr.tar_type] ? {
                        d: arrows[assr.tar_type],
                        fill: color,
                        stroke: color,
                    } : undefined,
                },
                type: 'line',
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

    return useMemo(() => {
        let createEdgeFrom: string | null = null;
        const exploreMode = ['drag-canvas', 'drag-element', {
            type: 'lasso-select',
            trigger: 'shift',
            onSelect(nodes: any, edges: any) {
                const selected: IFieldMeta[] = [];
                for (const node of nodes) {
                    const fid = node.id as string | undefined;
                    if (fid) {
                        const f = fieldsRef.current.find(which => which.fid === fid);
                        if (f) {
                            selected.push(f);
                        }
                    }
                    graphRef.current?.setElementState(node.id, []);
                }
                for (const edge of edges) {
                    graphRef.current?.setElementState(edge.id, []);
                }
                handleLassoRef.current?.(selected);
            },
        }];
        const editMode = ['drag-canvas', {
            type: 'create-edge',
            trigger: 'drag',
            shouldBegin(e: any) {
                const sourceFid = e.itemId as string | undefined;
                if (sourceFid) {
                    createEdgeFrom = sourceFid;
                }
                return true;
            },
            shouldEnd(e: any) {
                if (createEdgeFrom === null) {
                    return false;
                }
                const targetFid = e.itemId as string | undefined;
                if (targetFid) {
                    if (createEdgeFrom !== targetFid) {
                        handleLinkRef.current?.(createEdgeFrom, targetFid);
                    }
                }
                createEdgeFrom = null;
                return false;
            },
        }];
        const cfg = {
            width: widthRef.current,
            height: GRAPH_HEIGHT,
            behaviors: exploreMode,
            animation: true,
            layout: {
                type: 'fruchterman',
                // 启用 GPU 加速会导致数据更新时视图变化很大
                gpuEnabled: false,
                speed: 1,
                // for rendering after each iteration
                tick: () => {
                    graphRef.current?.render();
                },
            },
            node: {
                style: {
                    size: 20,
                    lineWidth: 1,
                },
                state: {
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
            },
            edge: {
                style: {
                    lineWidth: 1,
                    stroke: '#F6BD16',
                    opacity: 0.9,
                },
                state: {
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
            },
        };
        return cfg;
    }, [graphRef]);
};
