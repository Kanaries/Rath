import { useMemo, useRef, CSSProperties } from "react";
import G6, { Graph, GraphData, GraphOptions } from "@antv/g6";
import { LinkWeightSet, PagLink, PAG_NODE, WeightedPagLink } from "../config";
import type { IFieldMeta } from "../../../interfaces";


export const GRAPH_HEIGHT = 600;

export type GraphNodeAttributes = Partial<{
    description: string;
    style: Partial<{
        size: number;
        label: string;
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
    size: number;
    subtext?: string;
    subtextFill?: string;
    labelCfg: Partial<{
        position: 'center' | 'top' | 'left' | 'right' | 'bottom';
        offset: number;
        style: Partial<{
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
}>;

export const NodeType = 'field-node';

G6.registerNode(
    NodeType,
    {
        afterDraw(cfg, group: any) {
            const label = cfg?.subtext as string | undefined;
            if (label) {
                group.addShape('text', {
                    attrs: {
                        x: 16,
                        y: 0,
                        textAlign: 'left',
                        textBaseline: 'middle',
                        text: label,
                        fill: cfg?.subtextFill ?? '#666',
                        fontSize: 10,
                    },
                });
            }
        },
    },
    'circle',
);

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
    groups?: readonly Readonly<{
        root: string;
        children: string[];
        expanded: boolean;
    }>[];
    PAG: readonly PagLink[];
    thresholds?: {
        /**
         * @default 0
         */
        [key in keyof LinkWeightSet]?: number;
    };
    /** @default Infinity */
    limit?: number;
    renderNode?: (node: Readonly<IFieldMeta>) => GraphNodeAttributes | undefined,
}

export const useRenderData = ({
    mode,
    fields,
    groups = [],
    PAG,
    thresholds,
    limit = Infinity,   // TODO: 目前暂时关掉
    renderNode,
}: IRenderDataProps) => {
    const nodes = useMemo<NonNullable<GraphData['nodes']>>(() => {
        return fields.reduce<NonNullable<GraphData['nodes']>>((list, f) => {
            const fAsRoot = groups.find(group => group.root === f.fid);
            if (fAsRoot) {
                if (!fAsRoot.expanded) {
                    return list.concat([ {
                        type: 'rect',
                        id: `${f.fid}`,
                        size: 24,
                        description: `${f.name || f.fid} +`,
                        ...renderNode?.(f),
                        style: {
                            ...renderNode?.(f)?.style,
                            radius: 4,
                            cursor: 'zoom-in',
                        },
                        labelCfg: {
                            ...renderNode?.(f)?.labelCfg,
                            style: {
                                ...renderNode?.(f)?.labelCfg?.style,
                                cursor: 'zoom-in',
                            } as unknown as {},
                            position: 'top',
                            offset: 2,
                        },
                    }]);
                }
                return list;
            }
            const fAsLeaf = groups.find(group => group.children.includes(f.fid));
            if (fAsLeaf) {
                if (fAsLeaf.expanded) {
                    return list.concat([ {
                        type: NodeType,
                        id: `${f.fid}`,
                        size: 18,
                        description: f.name || f.fid,
                        ...renderNode?.(f),
                        style: {
                            ...renderNode?.(f)?.style,
                            cursor: 'zoom-out',
                            lineDash: [4, 4],
                        },
                        labelCfg: {
                            ...renderNode?.(f)?.labelCfg,
                            style: {
                                ...renderNode?.(f)?.labelCfg?.style,
                                fontSize: 10,
                                cursor: 'zoom-out',
                            } as unknown as {},
                            position: 'top',
                            offset: 2,
                        },
                    }]);
                }
                return list;
            }
            return list.concat([{
                type: NodeType,
                id: `${f.fid}`,
                description: f.name || f.fid,
                ...renderNode?.(f),
                style: {
                    cursor: 'pointer',
                    ...renderNode?.(f)?.style,
                },
                labelCfg: {
                    ...renderNode?.(f)?.labelCfg,
                    style: {
                        ...renderNode?.(f)?.labelCfg?.style,
                        cursor: 'pointer',
                    } as unknown as {},
                    position: 'top',
                    offset: 2,
                },
            }]);
        }, []);
    }, [fields, groups, renderNode]);
    const realEdges = useMemo<NonNullable<GraphData['edges']>>(() => {
        let links: WeightedPagLink[] = [];

        const result = PAG.filter(({ weight }) => {
            if (mode === 'edit') {
                return true;
            }
            for (const key of Object.keys(thresholds ?? {}) as (keyof LinkWeightSet)[]) {
                const threshold = thresholds?.[key] ?? 0;
                const w = key === 'weight' ? Math.abs(
                    2 / (1 + Math.exp(- (weight?.weight ?? 0))) - 1
                ) : weight?.[key];
                if ((w ?? 0) < threshold) {
                    return false;
                }
            }
            return true;
        }).map((link) => {
            return {
                ...link,
                weight: link.weight ?? {},
            };
        });

        for (const link of result) {
            const sources: [string, PAG_NODE][] = [];
            const targets: [string, PAG_NODE][] = [];
            const { src, src_type, tar, tar_type } = link;
            ([[src, src_type, sources], [tar, tar_type, targets]] as [string, PAG_NODE, [string, PAG_NODE][]][]).forEach(([fid, lType, list]) => {
                const fAsLeaf = groups.find(group => group.children.includes(fid));
                if (fAsLeaf) {
                    if (fAsLeaf.expanded) {
                        list.push([fid, lType]);
                    } else {
                        list.push([fAsLeaf.root, lType]);
                    }
                    return list;
                } else {
                    list.push([fid, lType]);
                }
            });
            for (const s of sources) {
                for (const t of targets) {
                    links.push({
                        src: s[0],
                        src_type: s[1],
                        tar: t[0],
                        tar_type: t[1],
                        weight: link.weight,
                    });
                }
            }
        }

        links = links.reduce<typeof links>((list, link) => {
            const another = list.find(which => which.src === link.src && which.tar === link.tar);
            if (another) {
                another.src_type = another.src_type === link.src_type ? another.src_type : PAG_NODE.CIRCLE;
                another.tar_type = another.tar_type === link.tar_type ? another.tar_type : PAG_NODE.CIRCLE;
            } else {
                const anotherReversed = list.find(which => which.src === link.tar && which.tar === link.src);
                if (anotherReversed) {
                    anotherReversed.src_type = anotherReversed.tar_type === link.src_type ? anotherReversed.src_type : PAG_NODE.CIRCLE;
                    anotherReversed.tar_type = anotherReversed.src_type === link.tar_type ? anotherReversed.tar_type : PAG_NODE.CIRCLE;
                } else {
                    list.push(link);
                }
            }
            return list;
        }, []).filter(({ src, tar }) => src !== tar);

        return links.map((link, i) => {
            if (mode === 'edit') {
                const isForbiddenType = [link.src_type, link.tar_type].includes(PAG_NODE.EMPTY);
                const color = isForbiddenType ? '#c50f1f' : '#0027b4';

                return {
                    id: `bk_${i}`,
                    source: link.src,
                    target: link.tar,
                    style: {
                        lineWidth: 2,
                        lineAppendWidth: 5,
                        stroke: color,
                        startArrow: {
                            fill: color,
                            stroke: color,
                            path: arrows[link.src_type],
                        },
                        endArrow: {
                            fill: color,
                            stroke: color,
                            path: arrows[link.tar_type],
                        },
                    },
                    type: isForbiddenType ? ForbiddenEdgeType : undefined,
                };
            }
            const w = 2 / (1 + Math.exp(- (link.weight.weight ?? 0))) - 1;

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
                    lineWidth: 1 + Math.abs(w) * 2,
                },
                label: `${
                    'confidence' in link.weight ? `c=${(link.weight.confidence! * 100).toFixed(2).replace(/\.?0+$/, '')}%\n` : ''
                }${
                    'weight' in link.weight ? `w=${link.weight.weight!.toFixed(2).replace(/\.?0+$/, '')}(${w.toFixed(2).replace(/\.?0+$/, '')})\n` : ''
                }`.slice(0, /* remove trailing `\n` */ -1),
                labelCfg: {
                    style: {
                        fontSize: 9.85,
                        fill: '#2118',
                    },
                },
            };
        });
    }, [PAG, groups, mode, thresholds]);
    const inGroupEdges = useMemo<NonNullable<GraphData['edges']>>(() => {
        return groups.reduce<NonNullable<GraphData['edges']>>((list, group) => {
            if (group.expanded) {
                for (const src of group.children) {
                    for (const tar of group.children.filter(node => node !== src)) {
                        list.push({
                            id: `in_group__${list.length}__`,
                            source: src,
                            target: tar,
                            style: {
                                lineWidth: 1,
                                lineAppendWidth: 5,
                                stroke: '#888',
                                lineDash: [4, 4],
                                opacity: 0.4,
                            },
                        });
                    }
                }
            }
            return list;
        }, []);
    }, [groups]);
    return useMemo<GraphData>(() => ({
        nodes,
        edges: realEdges.concat(inGroupEdges),
    }), [nodes, realEdges, inGroupEdges]);
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
                gravity: 5,
                speed: 5,
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
                labelCfg: {
                    style: {
                        stroke: '#fff',
                        lineWidth: 2,
                    },
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
