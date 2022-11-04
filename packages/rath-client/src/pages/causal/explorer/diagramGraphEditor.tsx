import { forwardRef, useEffect, useMemo, useState } from "react";
// import { forceSimulation, forceLink, forceManyBody, forceY, forceCollide, forceX } from 'd3-force';
import { line as d3Line/*, curveMonotoneY*/, curveCatmullRom } from 'd3-shape';
import {
    dagStratify,
    sugiyama,
    decrossOpt,
    coordGreedy,
    coordQuad,
    decrossTwoLayer,
    layeringLongestPath,
    layeringSimplex,
    twolayerAgg,
    twolayerGreedy,
} from 'd3-dag';
import styled, { StyledComponentProps } from "styled-components";
// import { getRange } from "@kanaries/loa";
// import { Spinner, SpinnerSize } from "@fluentui/react";
import produce from "immer";
import type { IFieldMeta } from "../../../interfaces";
import { Flow, mergeFlows } from "./flowAnalyzer";
import { DiagramGraphData } from ".";


const line = d3Line<{ x: number; y: number }>().curve(curveCatmullRom).x(d => d.x).y(d => d.y);

const Container = styled.div`
    position: relative;
    width: 400px;
    height: 400px;
    > svg {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        & *:not(circle) {
            pointer-events: none;
        }
        & circle {
            cursor: pointer;
            pointer-events: all;
        }
        & text {
            user-select: none;
        }
        & line {
            opacity: 0.67;
        }
    }
`;

export type DiagramGraphEditorProps = Omit<StyledComponentProps<'div', {}, {
    fields: readonly Readonly<IFieldMeta>[];
    value: Readonly<DiagramGraphData>;
    /** @default 0 */
    cutThreshold?: number;
}, never>, 'onChange'> & {
    onChange: (value: Readonly<DiagramGraphData>) => void;
    onFocusChange: (index: number) => void;
};

// const LAYOUT = {
//     x: -50,
//     y: -50,
//     w: 100,
//     h: 100,
//     p: 0.05,
//     f: 0.02,
// } as const;

const MIN_RADIUS = 0.2;
const MAX_RADIUS = 0.38;
const MIN_STROKE_WIDTH = 0.04;
const MAX_STROKE_WIDTH = 0.09;

const DiagramGraphEditor = forwardRef<HTMLDivElement, DiagramGraphEditorProps>(({ fields, value, onChange, onFocusChange, cutThreshold = 0, ...props }, ref) => {
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
            })),
        }, totalScore];
    }, [value]);

    const normalizedLinks = useMemo(() => {
        const max = value.links.reduce<number>((m, d) => m > d.score ? m : d.score, 0);
        return data.links.map((link, i) => ({
            ...link,
            score: value.links[i].score / (max || 1),
        }));
    }, [value.links, data.links]);

    const normalizedNodes = useMemo(() => {
        const max = data.nodes.reduce<number>((m, d) => m > d.score ? m : d.score, 0);
        return data.nodes.map(node => ({
            ...node,
            score: node.score / (max || 1),
        }));
    }, [data.nodes]);

    const flows = useMemo<Flow[]>(() => {
        const flows: Flow[] = [];
        for (const node of data.nodes) {
            flows.push({
                id: `${node.id}`,
                parentIds: [],
            });
        }
        for (const link of normalizedLinks) {
            if (link.score > 0 && link.score >= cutThreshold) {
                mergeFlows(flows, {
                    id: `${link.target}`,
                    parentIds: [`${link.source}`],
                });
            }
        }
        return flows;
    }, [data.nodes, normalizedLinks, cutThreshold]);

    const tooManyLinks = data.links.length >= 16;

    const layout = useMemo(() => {
        return tooManyLinks
            ? sugiyama().layering(
                layeringSimplex()
            ).decross(
                decrossTwoLayer().order(twolayerGreedy().base(twolayerAgg()))
            ).coord(
                coordGreedy()
            )
            : sugiyama().layering(
                layeringLongestPath()
            ).decross(
                decrossOpt()
            ).coord(
                coordQuad()
            );
    }, [tooManyLinks]);

    const dag = useMemo(() => {
        const dag = dagStratify()(flows);
        return {
            // @ts-ignore
            size: layout(dag),
            steps: dag.size(),
            nodes: dag.descendants(),
            links: dag.links(),
        };
    }, [flows, layout]);

    // const nodes = useMemo(() => {
    //     let maxScore = 0;
    //     const all = fields.map((f, i) => {
    //         const fy = (data.nodes[i].causeSum - data.nodes[i].effectSum) / totalScore;
    //         const score = (data.nodes[i].causeSum + data.nodes[i].effectSum) / totalScore;
    //         maxScore = Math.max(score, maxScore);
    //         return {
    //             value: f,
    //             score,
    //             fy,
    //         };
    //     });
    //     return all.map(node => {
    //         const score = node.score / (maxScore || 1);
    //         const fy = node.fy;
    //         return {
    //             value: node.value,
    //             score,
    //             fy,
    //             layout: {
    //                 r: MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * score,
    //             },
    //         };
    //     });
    // }, [fields, data.nodes, totalScore]);

    // const [{ w, h }, setContainerSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

    // const svgRef = useRef<SVGSVGElement>(null);

    // useEffect(() => {
    //     const { current: svg } = svgRef;

    //     if (svg) {
    //         const cb = () => {
    //             const { width, height } = svg.getBoundingClientRect();
    //             if (width !== w || height !== h) {
    //                 setContainerSize({
    //                     w: width,
    //                     h: height,
    //                 });
    //             }
    //         };
    //         const ro = new ResizeObserver(cb);
    //         cb();
    //         ro.observe(svg);
    //         return () => ro.disconnect();
    //     }
    // }, [w, h]);

    // const [locations, setLocations] = useState<{ x: number; y: number }[]>([]);

    // const pendingRef = useRef<unknown>();

    // useEffect(() => {
    //     setLocations([]);

    //     const simulation = forceSimulation(data.nodes).velocityDecay(
    //         0.9
    //     ).force(
    //         'link', forceLink(data.links)
    //     ).force(
    //         'charge', forceManyBody().strength((_, i) => 2 / nodes[i].score)
    //     ).force(
    //         'x', forceX().strength(0.2)
    //     ).force(
    //         'y', forceY().strength((_, i) => nodes[i].fy * 0.2)
    //     ).force(
    //         'collide', forceCollide().radius(MAX_RADIUS).iterations(2)
    //     );

    //     pendingRef.current = simulation;

    //     simulation.on('end', () => {
    //         if (pendingRef.current !== simulation) {
    //             return;
    //         }
    //         setLocations(simulation.nodes() as unknown as { x: number; y: number }[]);
    //     });

    //     return () => {
    //         simulation.stop();
    //     };
    // }, [data, nodes, w]);

    // const coords = useMemo(() => {
    //     const width = w * (1 - LAYOUT.p * 2);
    //     const height = h * (1 - LAYOUT.p * 2);
    //     const [x1, x2] = getRange(locations.map(loc => loc.x));
    //     const [y1, y2] = getRange(locations.map(loc => loc.y));
    //     const cx = (x1 + x2) / 2;
    //     const cy = (y1 + y2) / 2;
    //     const xd = x2 - x1;
    //     const yd = y2 - y1;
    //     const scaleRatio = (xd / width >= yd / height ? xd / LAYOUT.w : yd / LAYOUT.h) * 2 * (1 - LAYOUT.p * 2);
    //     const fx = (x: number) => (x - cx) / scaleRatio;
    //     const fy = (y: number) => (y - cy) / scaleRatio;

    //     return locations.map(loc => ({
    //         x: fx(loc.x),
    //         y: fy(loc.y),
    //     }));
    // }, [locations, w, h]);

    // const nodesWithPosition = useMemo(() => {
    //     if (coords.length === 0) {
    //         return [];
    //     }
    //     const maxFy = nodes.reduce<number>((m, node) => Math.abs(node.fy) > m ? Math.abs(node.fy) : m, 0);
    //     return nodes.map((node, i) => ({
    //         value: node.value,
    //         score: node.score,
    //         fy: node.fy / maxFy,
    //         layout: {
    //             x: coords[i].x,
    //             y: coords[i].y,
    //             r: node.layout.r,
    //         },
    //     }));
    // }, [coords, nodes]);

    // const links = useMemo(() => {
    //     const max = value.links.reduce<number>((m, d) => m > d.score ? m : d.score, 0);
    //     return value.links.map(link => ({
    //         ...link,
    //         score: link.score / (max || 1),
    //     }));
    // }, [value.links]);

    const [selected, setSelected] = useState<number>(-1);

    useEffect(() => {
        setSelected(-1);
    }, [data]);

    useEffect(() => {
        onFocusChange(selected);
    }, [selected, onFocusChange]);

    const nodes = useMemo(() => {
        return dag.nodes.map(node => {
            const me = normalizedNodes[parseInt(node.data.id)];
            if (me) {
                return me;
            }
            return null;
        });
    }, [dag.nodes, normalizedNodes]);

    const links = useMemo(() => {
        return dag.links.map(link => {
            const source = dag.nodes.find(node => node === link.source)?.data.id;
            const target = dag.nodes.find(node => node === link.target)?.data.id;
            if (source && target) {
                const me = data.links.find(which => `${which.source}` === source && `${which.target}` === target);
                return me ?? null;
            }
            return null;
        });
    }, [dag, data]);
    // console.log(links)

    return (
        <Container ref={ref} {...props}>
            {/* <svg
                ref={svgRef}
                viewBox={`${LAYOUT.x} ${LAYOUT.y} ${LAYOUT.w} ${LAYOUT.h}`}
                strokeLinecap="round"
                strokeLinejoin="round"
                onClick={() => {
                    if (selected !== -1) {
                        setSelected(-1);
                    }
                }}
            >
                <defs>
                    <marker id="arrow" viewBox="0 -5 10 10" refX={15} refY="0" markerWidth={MAX_STROKE_WIDTH * 12} markerHeight={MAX_STROKE_WIDTH * 12} orient="auto">
                        <path fill="none" stroke="#5a87f1" strokeWidth={LAYOUT.f * LAYOUT.w} d="M0,-5L10,0L0,5" />
                    </marker>
                </defs>
                {nodesWithPosition.length && links.map(link => link.score >= cutThreshold ? (
                    <line
                        key={`${link.causeId}>${link.effectId}`}
                        x1={nodesWithPosition[link.causeId].layout.x}
                        y1={nodesWithPosition[link.causeId].layout.y}
                        x2={nodesWithPosition[link.effectId].layout.x}
                        y2={nodesWithPosition[link.effectId].layout.y}
                        fill="none"
                        stroke="#5a87f1"
                        strokeWidth={MIN_STROKE_WIDTH + (MAX_STROKE_WIDTH - MIN_STROKE_WIDTH) * link.score}
                        markerEnd="url(#arrow)"
                        style={{
                            filter: `hue-rotate(-${215 * link.score}deg) opacity(${
                                selected === -1 ? 1 : (
                                    link.causeId === selected || link.effectId === selected
                                ) ? 1 : 0.05
                            })`,
                        }}
                    />
                ) : null)}
                {nodesWithPosition.map((node, i) => (
                    <circle
                        key={node.value.fid}
                        cx={node.layout.x}
                        cy={node.layout.y}
                        r={node.layout.r}
                        stroke="none"
                        fill="#a35af1"
                        style={{
                            filter: `hue-rotate(${-90 * node.fy}deg) opacity(${
                                selected === -1 ? 1 : i === selected ? 1 : 0.3
                            })`,
                        }}
                        onClick={e => {
                            e.stopPropagation();
                            if (selected === -1) {
                                setSelected(i);
                            } else if (i === selected) {
                                setSelected(-1);
                            } else {
                                // link
                                onChange(produce(value, draft => {
                                    const idx = draft.links.findIndex(
                                        link => link.causeId === selected && link.effectId === i
                                    );
                                    if (idx !== -1) {
                                        draft.links[idx].score = 1;
                                    }
                                    const idxRev = draft.links.findIndex(
                                        link => link.effectId === selected && link.causeId === i
                                    );
                                    if (idxRev !== -1) {
                                        draft.links[idxRev].score = -1;
                                    }
                                }));
                            }
                        }}
                    />
                ))}
                {nodesWithPosition.map((node, i) => (
                    <text
                        key={node.value.fid}
                        x={node.layout.x}
                        y={node.layout.y}
                        dy={-0.3 * LAYOUT.f * LAYOUT.w - node.layout.r}
                        fontSize={LAYOUT.f * LAYOUT.w}
                        textAnchor="middle"
                        style={{
                            filter: `opacity(${
                                selected === -1 ? 1 : i === selected ? 1 : 0.3
                            })`,
                        }}
                    >
                        {node.value.name || node.value.fid}
                    </text>
                ))}
            </svg>
            {nodesWithPosition.length === 0 && (
                <Spinner
                    size={SpinnerSize.large}
                    styles={{
                        root: {
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                        }
                    }}
                />
            )} */}
            <svg
                viewBox={`0 0 ${dag.size.width} ${dag.size.height}`}
                width="400"
                height="400"
                strokeLinecap="round"
                strokeLinejoin="round"
                onClick={() => {
                    if (selected !== -1) {
                        setSelected(-1);
                    }
                }}
            >
                {/* <defs>
                    <marker id="flow-arrow" viewBox="0 -5 10 10" refX={23} refY="0" markerWidth={3} markerHeight={3} orient="auto">
                        <path fill="none" stroke="#9c94bb" strokeWidth={2} d="M0,-5L10,0L0,5" />
                    </marker>
                </defs> */}
                {dag.links.map((link, i) => (
                    <path
                        key={i}
                        d={line(link.points) ?? ''}
                        fill="none"
                        // stroke="#9c94bb"
                        stroke="#a35af180"
                        // strokeWidth={0.05}
                        // markerEnd="url(#flow-arrow)"
                        strokeWidth={MIN_STROKE_WIDTH + (MAX_STROKE_WIDTH - MIN_STROKE_WIDTH) * (links[i]?.value ?? 0)}
                        style={{
                            filter: `hue-rotate(-${46 + 90 * (links[i]?.value ?? 0)}deg) saturate(${links[i] ? 1 : 0}) opacity(${
                                selected === -1 ? 1 : 0.05
                            })`,
                        }}
                    />
                ))}
                {dag.nodes.map((node, i) => {
                    const idx = parseInt(node.data.id, 10);
                    const f = fields[idx];
                    return (
                        <g key={i} transform={`translate(${node.x ?? 0},${node.y ?? 0})`}>
                            <circle
                                r={MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * (nodes[i]?.score ?? 0)}
                                // fill="#463782"
                                // fill="#a35af1"
                                fill={nodes[i] ? nodes[i]!.diff < 0 ? '#1890ff' : '#13c2c2'  : 'gray'}
                                stroke="none"
                                style={{
                                    filter: `opacity(${
                                        selected === -1 ? 1 : idx === selected ? 1 : 0.3
                                    })`,
                                }}
                                onClick={e => {
                                    e.stopPropagation();
                                    if (selected === -1) {
                                        setSelected(idx);
                                    } else if (idx === selected) {
                                        setSelected(-1);
                                    } else {
                                        // link
                                        onChange(produce(value, draft => {
                                            const idxMe = draft.links.findIndex(
                                                link => link.causeId === selected && link.effectId === idx
                                            );
                                            if (idxMe !== -1) {
                                                draft.links[idxMe].score = 1;
                                            }
                                            const idxRev = draft.links.findIndex(
                                                link => link.effectId === selected && link.causeId === idx
                                            );
                                            if (idxRev !== -1) {
                                                draft.links[idxRev].score = -1;
                                            }
                                        }));
                                    }
                                }}
                            />
                            <text fill="#463782" stroke="#463782" strokeWidth={0.004} fontWeight="bold" fontSize={0.12} textAnchor="middle" >
                                {f.name ?? f.fid}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </Container>
    );
});


export default DiagramGraphEditor;
