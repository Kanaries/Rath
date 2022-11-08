import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import styled, { StyledComponentProps } from "styled-components";
import G6 from "@antv/g6";
import type { IFieldMeta } from "../../../interfaces";
import type { ModifiableBgKnowledge } from "../config";
import type { DiagramGraphData } from ".";


const Container = styled.div`
    overflow: hidden;
    > div {
        width: 100%;
        height: 100%;
    }
`;

export type GraphViewProps = Omit<StyledComponentProps<'div', {}, {
    fields: readonly Readonly<IFieldMeta>[];
    value: Readonly<DiagramGraphData>;
    cutThreshold: number;
    mode: 'explore' | 'edit';
    focus: number | null;
    onClickNode?: (node: DiagramGraphData['nodes'][number]) => void;
    onLinkTogether: (srcFid: string, tarFid: string) => void;
    preconditions: ModifiableBgKnowledge[];
}, never>, 'onChange' | 'ref'>;

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

const arrowsForBK = {
    'must-link': {
        start: 'M 12,0 L 28,8 L 28,-8 Z',
        end: 'M 12,0 L 28,8 L 28,-8 Z',
    },
    'must-not-link': {
        start: 'M 14,6 L 26,-6 M 14,-6 L 26,6',
        end: 'M 14,6 L 26,-6 M 14,-6 L 26,6',
    },
    'prefer-link': {
        start: 'M 12,0 L 18,6 L 24,0 L 18,-6 Z',
        end: 'M 12,0 L 18,6 L 24,0 L 18,-6 Z',
    },
} as const;

const GraphView = forwardRef<HTMLDivElement, GraphViewProps>((
    { fields, value, onClickNode, focus, cutThreshold, mode, onLinkTogether, preconditions, ...props },
    ref
) => {
    const [data] = useMemo(() => {
        let totalScore = 0;
        const nodeCauseWeights = value.nodes.map(() => 0);
        const nodeEffectWeights = value.nodes.map(() => 0);
        value.links.forEach(link => {
            nodeCauseWeights[link.effectId] += link.score;
            nodeEffectWeights[link.causeId] += link.score;
            totalScore += link.score * 2;
        });
        return [{
            nodes: value.nodes.map((node, i) => ({
                id: node.nodeId,
                index: i,
                causeSum: nodeCauseWeights[i],
                effectSum: nodeEffectWeights[i],
                score: (nodeCauseWeights[i] + nodeEffectWeights[i]) / totalScore,
                diff: (nodeCauseWeights[i] - nodeEffectWeights[i]) / totalScore,
            })),
            links: value.links.map(link => ({
                source: link.causeId,
                target: link.effectId,
                value: link.score / nodeCauseWeights[link.effectId],
                type: link.type,
            })).filter(link => link.value >= cutThreshold),
        }, totalScore];
    }, [value, cutThreshold]);

    const containerRef = useRef<HTMLDivElement>(null);

    const [size, setSize] = useState<[number, number]>([0, 0]);

    const preconditionsRef = useRef(preconditions);
    preconditionsRef.current = preconditions;

    const handleNodeClickRef = useRef(onClickNode);
    handleNodeClickRef.current = onClickNode;

    const handleLinkRef = useRef(onLinkTogether);
    handleLinkRef.current = onLinkTogether;

    const updateSelected = useRef((idx: number) => {});

    useEffect(() => {
        const { current: container } = containerRef;
        if (container) {
            const graph = new G6.Graph({
                container,
                width: size[0],
                height: size[1],
                linkCenter: true,
                modes: {
                    default: mode === 'edit' ? ['drag-canvas', 'drag-node', 'create-edge'] : ['drag-canvas', 'drag-node', 'click-select'],
                    altSelect: [
                        {
                            type: 'click-select',
                            trigger: 'alt',
                            multiple: false,
                        },
                        'drag-node',
                    ],
                },
                animate: true,
                layout: {
                  type: 'fruchterman',
                  gravity: 5,
                  speed: 10,
                  // for rendering after each iteration
                  tick: () => {
                    graph.refreshPositions()
                  }
                },
                // layout: {
                //     type: 'gForce',
                //     gpuEnabled: true,
                //     maxIteration: 1000,
                //     // type: 'gForce',
                //     // maxIteration: 500,
                //     // gatherDiscrete: true,
                //     // //nodeSize: 100,
                //     // //nodeSpacing: 100,
                //     // //gatherDiscreteCenter: [500, 100],
                //     // descreteGravity: 200,
                //     // linkDistanceFunc: (e: any) => {
                //     //     if (e.source === '0') return 10;
                //     //     return 1;
                //     // },
                //     // getMass: (d: any) => {
                //     //     if (d.id === '0') return 100;
                //     //     return 1;
                //     // },
                //     // // speed: 10,
                //     // // maxIteration: 500,
                //     // // // for rendering after each iteration
                //     // // tick: () => {
                //     // //     graph.refreshPositions()
                //     // // },
                // },
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
            });
            graph.node(node => ({
                label: node.description ?? node.id,
            }));
            graph.data({
                nodes: data.nodes.map((node, i) => ({ id: `${node.id}`, description: fields[i].name ?? fields[i].fid })),
                edges: [
                    ...data.links.map((link, i) => ({
                        id: `link_${i}`,
                        source: `${link.source}`,
                        target: `${link.target}`,
                        style: {
                            startArrow: {
                                fill: '#F6BD16',
                                path: arrows[link.type].start,
                            },
                            endArrow: {
                                fill: '#F6BD16',
                                path: arrows[link.type].end,
                            },
                        },
                    })),
                    ...(mode === 'edit' ? preconditionsRef.current.map((bk, i) => ({
                        id: `bk_${i}`,
                        source: `${fields.findIndex(f => f.fid === bk.src)}`,
                        target: `${fields.findIndex(f => f.fid === bk.tar)}`,
                        style: {
                            startArrow: {
                                fill: '#F6BD16',
                                path: arrowsForBK[bk.type].start,
                            },
                            endArrow: {
                                fill: '#F6BD16',
                                path: arrowsForBK[bk.type].end,
                            },
                        },
                    })) : []),
                ],
            });
            graph.render();

            graph.on('aftercreateedge', (e: any) => {
                const edge = e.edge._cfg;
                const source = fields[parseInt(edge.source._cfg.id, 10)];
                const target = fields[parseInt(edge.target._cfg.id, 10)];
                handleLinkRef.current(source.fid, target.fid);
                const edges = graph.save().edges;
                G6.Util.processParallelEdges(edges);
                graph.getEdges().forEach((edge, i) => {
                    graph.updateItem(edge, {
                        // @ts-ignore
                        curveOffset: edges[i].curveOffset,
                        // @ts-ignore
                        curvePosition: edges[i].curvePosition,
                    });
                });
            });

            graph.on('nodeselectchange', (e: any) => {
                const selected = e.selectedItems.nodes[0]?._cfg.id;
                const idx = selected === undefined ? null : parseInt(selected, 10);

                if (idx !== null) {
                    handleNodeClickRef.current?.({ nodeId: idx });
                }
            });

            updateSelected.current = idx => {
                const prevSelected = graph.findAllByState('node', 'selected')[0]?._cfg?.id;
                const prevSelectedIdx = prevSelected ? parseInt(prevSelected, 10) : null;

                if (prevSelectedIdx === idx) {
                    return;
                } else if (prevSelectedIdx !== null) {
                    graph.setItemState(`${prevSelectedIdx}`, 'selected', false);
                }
                graph.setItemState(`${idx}`, 'selected', true);
            };

            return () => {
                // graph.destroy();
                container.innerHTML = '';
            };
        }
    }, [data, size, mode, fields]);

    useEffect(() => {
        if (focus !== null) {
            updateSelected.current(focus);
        }
    }, [focus]);

    useEffect(() => {
        const { current: container } = containerRef;
        if (container) {
            const cb = () => {
                const { width, height } = container.getBoundingClientRect();
                setSize([width, height]);
            };
            const ro = new ResizeObserver(cb);
            const icb: IntersectionObserverCallback = ([entry]) => {
                if (entry.intersectionRatio > 0) {
                    cb();
                    ito.disconnect();
                }
            };
            const ito = new IntersectionObserver(icb);   // 防止因为卡顿获取到错误的高度
            ro.observe(container);
            ito.observe(container);
            return () => {
                ro.disconnect();
                ito.disconnect();
            };
        }
    }, []);

    return (
        <Container
            {...props}
            ref={ref}
            onClick={e => e.stopPropagation()}
        >
            <div ref={containerRef} />
        </Container>
    );
});


export default GraphView;
