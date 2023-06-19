import { PrimaryButton, Spinner } from '@fluentui/react';
import produce from 'immer';
import { DragEvent, memo, MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import intl from 'react-intl-universal';
import type { TableInfo } from '../../pages/dataConnection/database/interfaces';
import Link from './link';
import { IDBGraph } from './localTypes';
import DBNode from './node';
import { encodePath, hasCircle } from './utils';
import { BOX_HEIGHT, BOX_WIDTH, BOX_PADDING } from './config';
import { DBBox, DiagramContainer, ListContainer } from './components';

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    > * {
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: 0%;
        margin: 0;
        padding: 0;
    }
    border-bottom: 1px solid #eee;
`;

const Output = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0.5em 0.5em 0.8em;

    > span {
        flex-grow: 1;
        flex-shrink: 1;
        padding: 0 1em;
        overflow: hidden;
        max-width: 30vw;
    }
`

export interface DbGraphProps {
    busy?: boolean;
    disabled?: boolean;
    tables: TableInfo[];
    graph: IDBGraph;
    sql: string;
    setQuery?: (q: string) => void;
    setGraph: (graph: IDBGraph) => void;
    preview: () => void;
}

const DbGraph = memo<DbGraphProps>(function DbGraph ({ busy = false, disabled = false, graph, setGraph, tables, preview, sql, setQuery }) {
    const [width, setWidth] = useState(400);
    const [height, setHeight] = useState(300);
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const c = container.current;
        if (c) {
            const cb = () => {
                const { width, height } = c.getBoundingClientRect();
                setWidth(width);
                setHeight(height);
            };
            const ro = new ResizeObserver(cb);
            ro.observe(c);
            cb();

            return () => ro.disconnect();
        }
    }, []);

    useEffect(() => {
        setQuery?.('');
    }, [setQuery])

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
                        setGraph(produce(graph, draft => {
                            draft.nodes.push({
                                source: dragSourceRef.current!,
                                x,
                                y,
                            });
                        }));
                    }

                    break;
                }
                case 'move': {
                    if (dragNodeRef.current !== null) {
                        setGraph(produce(graph, draft => {
                            draft.nodes[dragNodeRef.current!].x = x;
                            draft.nodes[dragNodeRef.current!].y = y;
                        }));
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
    }, [width, height, graph, setGraph]);

    const deleteNode = useCallback((index: number) => {
        if (index < graph.nodes.length) {
            const edges: typeof graph.edges = [];

            const shift = (i: number): number => {
                return i > index ? i - 1 : i;
            };

            graph.edges.forEach(edge => {
                if (edge.from.table !== index && edge.to.table !== index) {
                    edges.push({
                        from: {
                            table: shift(edge.from.table),
                            colIdx: edge.from.colIdx,
                        },
                        to: {
                            table: shift(edge.to.table),
                            colIdx: edge.to.colIdx,
                        },
                        joinOpt: edge.joinOpt,
                    });
                }
            });

            setGraph(produce(graph, draft => {
                draft.nodes.splice(index, 1);
            }));
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
                from: {
                    table: linkPreview.from,
                    colIdx: 0,
                },
                to: {
                    table: linkPreview.to,
                    colIdx: 0,
                },
                joinOpt: 'LEFT JOIN',
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
    }, [linkPreview, width, height]);

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
                [edge.from, edge.to].every(d => [index, linkPreview.from].includes(d.table))
            )));

            const willBeCircle = hasCircle(graph.edges, linkPreview.from, index);

            if (alreadyLinked || willBeCircle) {
                return;
            }

            setLinkPreview({
                from: linkPreview.from,
                to: index,
            });
        }
    }, [linkPreview, graph.edges]);

    const handleLinkOut = useCallback((ex: number, ey: number) => {
        if (container.current && linkPreview) {
            const box = container.current.getBoundingClientRect();

            const [tx, ty] = [
                ex - box.x,
                ey - box.y,
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
    }, [linkPreview, width, height]);

    return (<>
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
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                <svg
                    width={`${width}px`}
                    height={`${height}px`}
                    style={{ backgroundColor: '#cecece20' }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <g>
                        {graph.edges.map((edge, i) => {
                            const nodeFrom = graph.nodes[edge.from.table];
                            const nodeTo = graph.nodes[edge.to.table];
                            const tableFrom = tables.find(t => t.name === nodeFrom.source);
                            const tableTo = tables.find(t => t.name === nodeTo.source);

                            if (!tableFrom) {
                                console.error(`Table ${tableFrom} is not found.`);
                                return null;
                            }
                            if (!tableTo) {
                                console.error(`Table ${tableTo} is not found.`);
                                return null;
                            }

                            return (
                                <Link
                                    key={i}
                                    from={{
                                        layout: nodeFrom,
                                        allCols: tableFrom.meta.map(m => m.key),
                                        colIdx: edge.from.colIdx,
                                        setColIdx: idx => setGraph(produce(graph, draft => {
                                            draft.edges[i].from.colIdx = idx;
                                        })),
                                    }}
                                    to={{
                                        layout: nodeTo,
                                        allCols: tableTo.meta.map(m => m.key),
                                        colIdx: edge.to.colIdx,
                                        setColIdx: idx => setGraph(produce(graph, draft => {
                                            draft.edges[i].to.colIdx = idx;
                                        })),
                                    }}
                                    joinOpt={edge.joinOpt}
                                    setJoinOpt={opt => setGraph(produce(graph, draft => {
                                        draft.edges[i].joinOpt = opt;
                                    }))}
                                    deleteLink={() => setGraph(produce(graph, draft => {
                                        draft.edges.splice(i, 1);
                                    }))}
                                    reverse={() => setGraph(produce(graph, draft => {
                                        draft.edges[i] = {
                                            from: edge.to,
                                            to: edge.from,
                                            joinOpt: edge.joinOpt,
                                        };
                                    }))}
                                />
                            );
                        })}
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
                </svg>
                {graph.nodes.map((node, index) => {
                    return (
                        <DBNode
                            key={index}
                            layout={node}
                            label={node.source}
                            isLinking={linkPreview?.from === index}
                            readyToBeLinked={linkPreview ? linkPreview.from !== index : false}
                            readyToLink={graph.edges.every(e => e.from.table !== index)}
                            handleDragStart={offset => {
                                dragOffsetRef.current = offset;
                                dragEffectRef.current = 'move';
                                dragSourceRef.current = null;
                                dragNodeRef.current = index;
                            }}
                            beginPath={() => setLinkPreview({
                                from: index,
                                to: {
                                    x: graph.nodes[index].x + BOX_WIDTH / 2,
                                    y: graph.nodes[index].y + BOX_HEIGHT / 2,
                                },
                            })}
                            handleLinkOver={() => handleLinkOver(index)}
                            handleLinkOut={handleLinkOut}
                        />
                    );
                })}
            </DiagramContainer>
        </Container>
        <Output>
            <span>
                {sql}
            </span>
            <PrimaryButton
                disabled={busy || disabled || tables.length === 0 || !sql}
                onClick={preview}
                iconProps={busy ? undefined : { iconName: "Play" }}
            >
                {busy ? <Spinner /> : intl.get('common.run')}
            </PrimaryButton>
        </Output>
    </>);
});

export default DbGraph;
