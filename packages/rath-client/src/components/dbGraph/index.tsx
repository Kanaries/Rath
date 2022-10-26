import { DragEvent, memo, MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import type { TableInfo } from '../../pages/dataSource/selection/database/api';
import Link from './link';
import { IDBGraph } from './localTypes';
import DBNode from './node';

const height = 400;
export const BOX_WIDTH = 120;
export const BOX_HEIGHT = 40;
const BOX_PADDING = 20;

const Container = styled.div({
    display: 'flex',
    flexDirection: 'row',
    height: `${height}px`,
    overflow: 'hidden',
    border: '1px solid',
    borderTop: 'none',
});
const ListContainer = styled.div({
    flexGrow: 1,
    flexShrink: 1,
    overflow: 'hidden scroll',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '10em',
    borderRight: '1px solid #888',
    '> *': {
        flexGrow: 0,
        flexShrink: 0,
        margin: '0.4em 0',
    },
});
const DiagramContainer = styled.div({
    flexGrow: 1,
    flexShrink: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
    boxSizing: 'border-box',
    '> *': {
        flexGrow: 0,
        flexShrink: 0,
    },
});
export const DBBox = styled.span`
    user-select: none;
    width: ${BOX_WIDTH}px;
    height: ${BOX_HEIGHT}px;
    padding: 0 0.5em;
    overflow: hidden;
    text-overflow: ellipsis;
    background-color: #fff;
    border: 1px solid #555;
    border-radius: 2px;
    box-shadow: 0 0 4px #8888;
    text-align: center;
    line-height: ${BOX_HEIGHT - 2}px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    &:hover {
        background-color: #f3f3f3;
    }
`;
function getBoxRightPoint(x: number, y: number) {
    return [x + BOX_WIDTH, y + BOX_HEIGHT / 2];
}

function getBoxLeftPoint(x: number, y: number) {
    return [x, y + BOX_HEIGHT / 2];
}

function getMidPoint(x1: number, y1: number, x2: number, y2: number): [number, number] {
    return [(x1 + x2) / 2, (y1 + y2) / 2];
}

const STROKE_RADIUS = 12;

export const encodePath = (x1: number, y1: number, x2: number, y2: number, isPreview = false): string => {
    const main = (() => {
        if (Math.abs(x1 - x2) < 1.2 * BOX_WIDTH) {
            const cy = (y1 + y2) / 2;
            const ya = cy - Math.sign(y2 - y1) * STROKE_RADIUS;
            const xb = x1 + Math.sign(x2 - x1) * STROKE_RADIUS;
            const xc = x2 - Math.sign(x2 - x1) * STROKE_RADIUS;
            const yd = cy + Math.sign(y2 - y1) * STROKE_RADIUS;
            if (Math.abs(x1 - x2) < 2 * STROKE_RADIUS) {
                return `M${x1},${y1} V${ya} C${x1},${cy} ${x2},${cy} ${x2},${yd} V${y2}`;
            }
            return `M${x1},${y1} V${ya} Q${x1},${cy} ${xb},${cy} H${xc} Q${x2},${cy} ${x2},${yd} V${y2}`;
        } else {
            const cx = (x1 + x2) / 2;
            const xa = cx - Math.sign(x2 - x1) * STROKE_RADIUS;
            const yb = y1 + Math.sign(y2 - y1) * STROKE_RADIUS;
            const yc = y2 - Math.sign(y2 - y1) * STROKE_RADIUS;
            const xd = cx + Math.sign(x2 - x1) * STROKE_RADIUS;
            if (Math.abs(y1 - y2) < 2 * STROKE_RADIUS) {
                return `M${x1},${y1} H${xa} C${cx},${y1} ${cx},${y2} ${xd},${y2} H${x2}`;
            }
            return `M${x1},${y1} H${xa} Q${cx},${y1} ${cx},${yb} V${yc} Q${cx},${y2} ${xd},${y2} H${x2}`;
        }
    })();

    const arrow = (() => {
        if (isPreview) {
            return '';
        }
        if (Math.abs(x1 - x2) < 1.2 * BOX_WIDTH) {
            const x = x2;
            if (y1 >= y2) {
                const y = y2 + BOX_HEIGHT / 2;
                return `M${x},${y} l-6,6 M${x},${y} l6,6`;
            }
            const y = y2 - BOX_HEIGHT / 2;
            return `M${x},${y} l-6,-6 M${x},${y} l6,-6`;
        } else {
            const y = y2;
            if (x1 >= x2) {
                const x = x2 + BOX_WIDTH / 2;
                return `M${x},${y} l6,-6 M${x},${y} l6,6`;
            }
            const x = x2 - BOX_WIDTH / 2;
            return `M${x},${y} l-6,-6 M${x},${y} l-6,6`;
        }
    })();

    return `${main}${arrow}`;
};

export interface DbGraphProps {
    tables: TableInfo[];
    graph: IDBGraph;
    setGraph: (graph: IDBGraph) => void;
}

const DbGraph = memo<DbGraphProps>(function DbGraph ({ graph, setGraph, tables }) {
    const [width, setWidth] = useState(600);
    const container = useRef<HTMLDivElement>(null);
    // const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    // const fixes = useRef<{x: number; y: number}>({ x: 0, y: 0 })

    // const updateNodePosition = (id: string | null, x: number, y: number) => {
    //     if (id === null)return;
    //     const newGraph = { ...graph };
    //     const node = newGraph.nodes.find((n) => n.id === id);
    //     if (node) {
    //         node.x = x;
    //         node.y = y;
    //     }
    //     setGraph(newGraph);
    // };

    useEffect(() => {
        const c = container.current;

        if (c) {
            setWidth(c.getBoundingClientRect().width);

            const cb = () => {
                setWidth(c.getBoundingClientRect().width);
            };

            const ro = new ResizeObserver(cb);

            ro.observe(c);

            return () => ro.disconnect();
        }
    }, []);

    const dragEffectRef = useRef<null | 'append' | 'move'>(null);
    const dragOffsetRef = useRef<[number, number]>([0, 0]);
    const dragSourceRef = useRef<null | string>(null);
    const dragNodeRef = useRef<null | number>(null);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.stopPropagation();

        if (container.current && dragEffectRef.current) {
            const box = container.current.getBoundingClientRect();

            const [tx, ty] = [
                e.clientX - dragOffsetRef.current[0] - box.x,
                e.clientY - dragOffsetRef.current[1] - box.y,
            ];

            const x = Math.round(Math.max(Math.min(tx, width - BOX_PADDING - BOX_WIDTH - 1), BOX_PADDING));
            const y = Math.round(Math.max(Math.min(ty, height - BOX_PADDING - BOX_HEIGHT - 1), BOX_PADDING));

            switch (dragEffectRef.current) {
                case 'append': {
                    if (dragSourceRef.current && !graph.nodes.find(node => node.source === dragSourceRef.current)) {
                        setGraph({
                            nodes: [...graph.nodes, {
                                source: dragSourceRef.current,
                                x,
                                y,
                            }],
                            edges: graph.edges,
                        });
                    }

                    break;
                }
                case 'move': {
                    if (dragNodeRef.current !== null) {
                        const node = graph.nodes[dragNodeRef.current];

                        setGraph({
                            nodes: [
                                ...graph.nodes.slice(0, dragNodeRef.current),
                                {
                                    source: node.source,
                                    x,
                                    y
                                },
                                ...graph.nodes.slice(dragNodeRef.current + 1),
                            ],
                            edges: graph.edges,
                        });
                    }

                    break;
                }
                default: {
                    break;
                }
            }
        }

        dragEffectRef.current = null;
        dragSourceRef.current = null;
        dragNodeRef.current = null;
    }, [width, graph, setGraph]);

    const deleteNode = useCallback((index: number) => {
        if (index < graph.nodes.length) {
            const edges: typeof graph.edges = [];

            const shift = (i: number): number => {
                return i > index ? i - 1 : i;
            };

            graph.edges.forEach(edge => {
                if (edge.from !== index && edge.to !== index) {
                    edges.push({
                        from: shift(edge.from),
                        to: shift(edge.to),
                        type: edge.type,
                    });
                }
            });

            setGraph({
                nodes: [
                    ...graph.nodes.slice(0, index),
                    ...graph.nodes.slice(index + 1),
                ],
                edges,
            });
        }
    }, [graph, setGraph]);

    const [linkPreview, setLinkPreview] = useState<null | {
        from: number;
        to: number | { x: number; y: number }
    }>(null);

    const commitLink = () => {
        if (typeof linkPreview?.to !== 'number') {
            return;
        }

        setGraph({
            nodes: graph.nodes,
            edges: [...graph.edges, {
                from: linkPreview.from,
                to: linkPreview.to,
                type: 'LEFT JOIN',
            }],
        });
    };

    const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (container.current && linkPreview && typeof linkPreview.to !== 'number') {
            const box = container.current.getBoundingClientRect();

            const [tx, ty] = [
                e.clientX - box.x,
                e.clientY - box.y,
            ];

            const x = Math.round(Math.max(Math.min(tx, width - BOX_PADDING - BOX_WIDTH - 1), BOX_PADDING));
            const y = Math.round(Math.max(Math.min(ty, height - BOX_PADDING - BOX_HEIGHT - 1), BOX_PADDING));

            setLinkPreview({
                from: linkPreview.from,
                to: {
                    x,
                    y,
                },
            });

            return;
        }
    }, [linkPreview]);

    const handleMouseUp = () => {
        if (container.current && linkPreview) {
            if (typeof linkPreview.to === 'number') {
                commitLink();
            }

            setLinkPreview(null);

            return;
        }
    };

    const handleLinkOver = useCallback((index: number) => {
        if (linkPreview) {
            const alreadyLinked = Boolean(graph.edges.find(edge => (
                [edge.from, edge.to].every(d => [index, linkPreview.from].includes(d))
            )));

            const willBeCircle = ((): boolean => {
                // const walk = (from: number, except?: number) => {

                // };

                // walk

                return false;
            })();

            if (alreadyLinked || willBeCircle) {
                return;
            }

            setLinkPreview({
                from: linkPreview.from,
                to: index,
            });
        }
    }, [linkPreview]);

    const handleLinkOut = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (container.current && linkPreview) {
            const box = container.current.getBoundingClientRect();

            const [tx, ty] = [
                e.clientX - box.x,
                e.clientY - box.y,
            ];

            const x = Math.round(Math.max(Math.min(tx, width - BOX_PADDING - BOX_WIDTH - 1), BOX_PADDING));
            const y = Math.round(Math.max(Math.min(ty, height - BOX_PADDING - BOX_HEIGHT - 1), BOX_PADDING));

            setLinkPreview({
                from: linkPreview.from,
                to: {
                    x,
                    y,
                },
            });

            return;
        }
    }, [linkPreview]);

    return (
        <Container>
            <ListContainer
                onDrop={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (dragNodeRef.current !== null) {
                        deleteNode(dragNodeRef.current);
                    }
                }}
                onDragOver={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    e.dataTransfer.dropEffect = dragNodeRef.current === null ? 'none' : 'move';
                }}
            >
                {tables.map(t => (
                    <DBBox
                        key={`db-node-table:${t.name}`}
                        title={t.name}
                        draggable
                        onDragStart={e => {
                            const target = e.target as HTMLSpanElement;
                            const box = target.getBoundingClientRect();
                            dragOffsetRef.current = [
                                e.clientX - box.x,
                                e.clientY - box.y,
                            ];
                            dragEffectRef.current = 'append';
                            dragSourceRef.current = t.name;
                            e.dataTransfer.setData('text/plain', t.name);
                            e.dataTransfer.dropEffect = 'copy';
                            // setDraggingNodeId(node.id)
                            // fixes.current.x = e.currentTarget.getBoundingClientRect().left - e.clientX
                            // fixes.current.y = e.currentTarget.getBoundingClientRect().top - e.clientY
                        }}
                    >
                        {t.name}
                    </DBBox>
                ))}
            </ListContainer>
            <DiagramContainer
                ref={container}
                style={{ height: `${height}px`, position: 'relative' }}
                onDrop={handleDrop}
                onDragOver={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    // console.log('d over', e);
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                // onDrop={(e) => {
                //     e.stopPropagation()
                //     if (container.current && draggingNodeId) {
                //         const contRect = container.current.getBoundingClientRect()
                //         updateNodePosition(draggingNodeId, e.clientX + fixes.current.x - contRect.left , e.clientY + fixes.current.y - contRect.top);
                //         setDraggingNodeId(null);

                //     }
                // }}
                // onDragOver={e => {
                //     e.preventDefault()
                //     if (container.current && draggingNodeId) {
                //         const contRect = container.current.getBoundingClientRect()
                //         updateNodePosition(draggingNodeId, e.clientX + fixes.current.x - contRect.left , e.clientY + fixes.current.y - contRect.top);

                //     }
                // }}
            >
                <svg
                    width={`${width}px`}
                    height={`${height}px`}
                    style={{ backgroundColor: '#8882' }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <g>
                        {graph.edges.map((edge, i) => (
                            <Link
                                key={i}
                                from={graph.nodes[edge.from]}
                                to={graph.nodes[edge.to]}
                                type={edge.type}
                                setType={type => {
                                    setGraph({
                                        nodes: graph.nodes,
                                        edges: [
                                            ...graph.edges.slice(0, i),
                                            {
                                                from: graph.edges[i].from,
                                                to: graph.edges[i].to,
                                                type,
                                            },
                                            ...graph.edges.slice(i + 1),
                                        ],
                                    });
                                }}
                                deleteLink={() => {
                                    setGraph({
                                        nodes: graph.nodes,
                                        edges: [
                                            ...graph.edges.slice(0, i),
                                            ...graph.edges.slice(i + 1),
                                        ],
                                    });
                                }}
                                reverse={() => {
                                    setGraph({
                                        nodes: graph.nodes,
                                        edges: [
                                            ...graph.edges.slice(0, i),
                                            {
                                                from: graph.edges[i].to,
                                                to: graph.edges[i].from,
                                                type: graph.edges[i].type,
                                            },
                                            ...graph.edges.slice(i + 1),
                                        ],
                                    });
                                }}
                            />
                        ))}
                    </g>
                    {linkPreview && (
                        <g style={{ pointerEvents: 'none', opacity: typeof linkPreview.to === 'number' ? 1 : 0.5 }} >
                            {typeof linkPreview.to === 'number' ? (
                                <path
                                    d={encodePath(
                                        graph.nodes[linkPreview.from].x + BOX_WIDTH / 2,
                                        graph.nodes[linkPreview.from].y + BOX_HEIGHT / 2,
                                        graph.nodes[linkPreview.to].x + BOX_WIDTH / 2,
                                        graph.nodes[linkPreview.to].y + BOX_HEIGHT / 2,
                                        true,
                                    )}
                                />
                            ) : (
                                <path
                                    d={encodePath(
                                        graph.nodes[linkPreview.from].x + BOX_WIDTH / 2,
                                        graph.nodes[linkPreview.from].y + BOX_HEIGHT / 2,
                                        linkPreview.to.x,
                                        linkPreview.to.y,
                                        true,
                                    )}
                                />
                            )}
                        </g>
                    )}
                    {/* {graph.edges.map((edge, index) => {
                        const fromNode = graph.nodes.find((node) => node.id === edge.from);
                        const toNode = graph.nodes.find((node) => node.id === edge.to);
                        if (!fromNode || !toNode) {
                            return null;
                        }
                        const fromPoint = getBoxRightPoint(fromNode.x, fromNode.y);
                        const toPoint = getBoxLeftPoint(toNode.x, toNode.y);
                        const midPoint = getMidPoint(fromPoint[0], fromPoint[1], toPoint[0], toPoint[1]);
                        return (
                            <g key={index}>
                                <path
                                    // d={`M ${fromPoint[0]} ${fromPoint[1]}  Q ${midPoint[0]} ${midPoint[1]} ${toPoint[0]} ${toPoint[1]}`}
                                    d={`M ${fromPoint[0]} ${fromPoint[1]} C ${toPoint[0]} ${fromPoint[1]} ${fromPoint[0]} ${toPoint[1]} ${toPoint[0]} ${toPoint[1]}`}
                                    stroke="#868686"
                                    strokeOpacity="1"
                                    fill="none"
                                    pointerEvents="visibleStroke"
                                    fillOpacity="1"
                                    className={`line selected`}
                                    style={{ strokeWidth: 2, cursor: 'pointer' }}
                                />
                                <circle cx={midPoint[0]} cy={midPoint[1]} r="5" fill="#333" />
                            </g>
                        );
                    })} */}
                    {/* <path
                        stroke="#868686"
                        strokeOpacity="1"
                        fill="none"
                        pointerEvents="visibleStroke"
                        fillOpacity="1"
                        className={`line selected`}
                        style={{ strokeWidth: 2, cursor: 'pointer' }}
                        d={`M ${getBoxRightPoint(pointA[0], pointA[1])} Q ${getMidPoint(pointA[0], pointA[1], pointB[0], pointB[1])} ${getBoxLeftPoint(pointB[0], pointB[1])}`}
                    ></path> */}
                </svg>
                {graph.nodes.map((node, index) => {
                    return (
                        <DBNode
                            key={index}
                            node={node}
                            id={index}
                            linkingId={linkPreview?.from ?? null}
                            handleDragStart={e => {
                                const target = e.target as HTMLSpanElement;
                                const box = target.getBoundingClientRect();
                                dragOffsetRef.current = [
                                    e.clientX - box.x,
                                    e.clientY - box.y,
                                ];
                                dragEffectRef.current = 'move';
                                dragSourceRef.current = null;
                                dragNodeRef.current = index;
                                e.dataTransfer.setData('text/plain', node.source);
                                e.dataTransfer.dropEffect = 'move';
                                // setDraggingNodeId(node.id)
                                // fixes.current.x = e.currentTarget.getBoundingClientRect().left - e.clientX
                                // fixes.current.y = e.currentTarget.getBoundingClientRect().top - e.clientY
                            }}
                            beginPath={() => {
                                setLinkPreview({
                                    from: index,
                                    to: {
                                        x: graph.nodes[index].x + BOX_WIDTH / 2,
                                        y: graph.nodes[index].y + BOX_HEIGHT / 2,
                                    },
                                });
                            }}
                            handleLinkOver={() => handleLinkOver(index)}
                            handleLinkOut={handleLinkOut}
                        />
                    );
                })}
            </DiagramContainer>
        </Container>
    );
});

export default DbGraph;
