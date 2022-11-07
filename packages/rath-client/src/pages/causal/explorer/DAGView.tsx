import { forwardRef, useMemo } from "react";
import { line as d3Line, curveCatmullRom } from 'd3-shape';
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
import type { IFieldMeta } from "../../../interfaces";
import { Flow, mergeFlows } from "./flowAnalyzer";
import type { DiagramGraphData } from ".";


const line = d3Line<{ x: number; y: number }>().curve(curveCatmullRom).x(d => d.x).y(d => d.y);

const Container = styled.div`
    position: relative;
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

export type DAGViewProps = Omit<StyledComponentProps<'div', {}, {
    fields: readonly Readonly<IFieldMeta>[];
    value: Readonly<DiagramGraphData>;
    cutThreshold: number;
    mode: 'explore' | 'edit';
    focus: number | null;
    onClickNode?: (node: DiagramGraphData['nodes'][number]) => void;
}, never>, 'onChange' | 'ref'>;

const MIN_RADIUS = 0.2;
const MAX_RADIUS = 0.38;
const MIN_STROKE_WIDTH = 0.04;
const MAX_STROKE_WIDTH = 0.09;

const DAGView = forwardRef<HTMLDivElement, DAGViewProps>((
    { fields, value, onClickNode, focus, cutThreshold, mode, ...props },
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
            if (link.score > 0.001 && link.score >= cutThreshold) {
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

    return (
        <Container {...props} ref={ref}>
            <svg
                viewBox={`0 0 ${dag.size.width} ${dag.size.height}`}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {dag.links.map((link, i) => (
                    <path
                        key={i}
                        d={line(link.points) ?? ''}
                        fill="none"
                        stroke="#a35af180"
                        strokeWidth={MIN_STROKE_WIDTH + (MAX_STROKE_WIDTH - MIN_STROKE_WIDTH) * (links[i]?.value ?? 0)}
                        style={{
                            filter: `hue-rotate(-${46 + 90 * (links[i]?.value ?? 0)}deg) saturate(${links[i] ? 1 : 0}) opacity(${
                                focus === null ? 1 : 0.05
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
                                fill={nodes[i] ? nodes[i]!.diff < 0 ? '#1890ff' : '#13c2c2'  : 'gray'}
                                stroke="none"
                                strokeWidth={0}
                                style={{
                                    filter: `opacity(${
                                        focus === null ? 1 : idx === focus ? 1 : 0.3
                                    })`,
                                }}
                                onClick={e => {
                                    e.stopPropagation();
                                    onClickNode?.(value.nodes[idx]);
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


export default DAGView;
