import { FC, useCallback, useEffect, useMemo, useState } from "react";
import {
    dagStratify,
    sugiyama,
    decrossOpt,
    layeringLongestPath,
    layeringSimplex,
    decrossTwoLayer,
    twolayerGreedy,
    twolayerAgg,
    coordGreedy,
    coordQuad,
} from 'd3-dag';
import { line as d3Line/*, curveMonotoneY*/, curveCatmullRom } from 'd3-shape';
import styled from "styled-components";
import type { IFieldMeta, IRow } from "../../../interfaces";
import { deepcopy } from "../../../utils";
import ColDist, { IBrushSignalStore } from "../crossFilter/colDist";
import type { DiagramGraphData } from ".";


export type NodeWithScore = {
    field: Readonly<IFieldMeta>;
    score: number;
};

export interface FlowAnalyzerProps {
    dataSource: IRow[];
    fields: readonly Readonly<IFieldMeta>[];
    data: DiagramGraphData;
    index: number;
    cutThreshold: number;
    onUpdate: (
        node: Readonly<IFieldMeta> | null,
        simpleCause: readonly Readonly<NodeWithScore>[],
        simpleEffect: readonly Readonly<NodeWithScore>[],
        composedCause: readonly Readonly<NodeWithScore>[],
        composedEffect: readonly Readonly<NodeWithScore>[],
    ) => void;
    onClickNode?: (node: DiagramGraphData['nodes'][number]) => void;
}

export type Flow = {
    id: string;
    parentIds: string[];
};

export const mergeFlows = (flows: Flow[], entering: Flow): void => {
    const item = flows.find(f => f.id === entering.id);
    if (item) {
        item.parentIds.push(...entering.parentIds);
    } else {
        flows.push(entering);
    }
};

const FLOW_HEIGHT = 500;

const SVGGroup = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    width: 100%;
    border: 1px solid #8888;
    display: flex;
    flex-direction: column;
    align-items: center;
    > svg {
        width: 100%;
        height: 40vh;
        overflow: hidden;
        & text {
            user-select: none;
        }
        & *:not(circle) {
            pointer-events: none;
        }
        & circle {
            pointer-events: all;
            cursor: pointer;
        }
    }
    > div {
        flex-grow: 0;
        flex-shrink: 0;
        display: flex;
        position: relative;
        height: ${FLOW_HEIGHT}px;
        > * {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
        }
        > div {
            > div {
                position: absolute;
                box-sizing: content-box;
                transform: translate(-50%, -50%);
                background-color: #463782;
                border: 2px solid #463782;
            }
        }
    }
`;

const line = d3Line<{ x: number; y: number }>().curve(curveCatmullRom).x(d => d.x).y(d => d.y);

const FlowAnalyzer: FC<FlowAnalyzerProps> = ({ dataSource, fields, data, index, cutThreshold, onUpdate, onClickNode }) => {
    const field = useMemo<IFieldMeta | undefined>(() => fields[index], [fields, index]);

    const normalizedLinks = useMemo(() => {
        const max = data.links.reduce<number>((m, d) => m > d.score ? m : d.score, 0);
        return data.links.map(link => {
            const relativeBasis = data.links.reduce<number>((sum, l) => {
                if (l.effectId === link.effectId) {
                    return sum + l.score;
                }
                return sum;
            }, 0);
            return {
                ...link,
                score: link.score / (max || 1),
                relativeBasis,
            };
        });
    }, [data.links]);

    const getPathScore = useCallback((effectIdx: number) => {
        const scores = new Map<number, number>();
        const walk = (rootIdx: number, weight: number, flags = new Map<number, 1>()) => {
            if (flags.has(rootIdx)) {
                return;
            }
            flags.set(rootIdx, 1);
            const paths = data.links.filter(link => link.effectId === rootIdx);
            for (const path of paths) {
                const nodeIdx = path.causeId;
                const value = path.score * weight;
                scores.set(nodeIdx, (scores.get(nodeIdx) ?? 0) + value);
                walk(nodeIdx, value, flags);
            }
        };
        walk(effectIdx, 1);
        return (causeIdx: number) => scores.get(causeIdx);
    }, [data.links]);

    const flowsAsOrigin = useMemo<Flow[]>(() => {
        if (field) {
            let links = normalizedLinks.map(link => link);
            const ready = [index];
            const flows: Flow[] = [{
                id: `${index}`,
                parentIds: [],
            }];
            while (ready.length) {
                const source = ready.shift()!;
                const nextLinks: typeof links = [];
                for (const link of links) {
                    if (link.causeId === source) {
                        if (link.score > 0.001 && link.score >= cutThreshold) {
                            mergeFlows(flows, {
                                id: `${link.effectId}`,
                                parentIds: [`${source}`],
                            });
                            ready.push(link.effectId);
                        }
                    } else {
                        nextLinks.push(link);
                    }
                }
                links = nextLinks;
            }
            return flows;
        }
        return [];
    }, [normalizedLinks, field, index, cutThreshold]);

    const flowsAsDestination = useMemo<Flow[]>(() => {
        if (field) {
            let links = normalizedLinks.map(link => link);
            const ready = [index];
            const flows: Flow[] = [{
                id: `${index}`,
                parentIds: [],
            }];
            while (ready.length) {
                const source = ready.shift()!;
                const nextLinks: typeof links = [];
                for (const link of links) {
                    if (link.effectId === source) {
                        if (link.score > 0.001 && link.score >= cutThreshold) {
                            mergeFlows(flows, {
                                id: `${source}`,
                                parentIds: [`${link.causeId}`],
                            });
                            mergeFlows(flows, {
                                id: `${link.causeId}`,
                                parentIds: [],
                            });
                            ready.push(link.causeId);
                        }
                    } else {
                        nextLinks.push(link);
                    }
                }
                links = nextLinks;
            }
            return flows;
        }
        return [];
    }, [normalizedLinks, field, index, cutThreshold]);

    useEffect(() => {
        if (field) {
            const getCauseScore = getPathScore(index);
            const [simpleCause, composedCause] = flowsAsDestination.reduce<[NodeWithScore[], NodeWithScore[]]>(([simple, composed], flow) => {
                const effectId = parseInt(flow.id, 10);
                const target = fields[effectId];
                for (const causeId of flow.parentIds.map(id => parseInt(id, 10))) {
                    const source = fields[causeId];
                    const score = getCauseScore(causeId);
                    if (score) {
                        if (target.fid === field.fid) {
                            simple.push({
                                field: source,
                                score,
                            });
                        } else if (!composed.some(f => f.field.fid === source.fid)) {
                            composed.push({
                                field: source,
                                score,
                            });
                        }
                    }
                }
                return [simple, composed];
            }, [[], []]);
            const [simpleEffect, composedEffect] = flowsAsOrigin.reduce<[NodeWithScore[], NodeWithScore[]]>(([simple, composed], flow) => {
                const effectId = parseInt(flow.id, 10);
                const target = fields[effectId];
                for (const causeId of flow.parentIds.map(id => parseInt(id, 10))) {
                    const source = fields[causeId];
                    const score = getPathScore(effectId)(index);
                    if (score) {
                        if (source.fid === field.fid) {
                            simple.push({
                                field: target,
                                score,
                            });
                        } else if (!composed.some(f => f.field.fid === target.fid)) {
                            composed.push({
                                field: target,
                                score,
                            });
                        }
                    }
                }
                return [simple, composed];
            }, [[], []]);
            onUpdate(field, simpleCause, simpleEffect, composedCause, composedEffect);
        } else {
            onUpdate(null, [], [], [], []);
        }
    }, [onUpdate, fields, field, flowsAsDestination, flowsAsOrigin, getPathScore, index]);

    const combinedFlows = useMemo(() => {
        const flows = deepcopy(flowsAsDestination) as typeof flowsAsDestination;
        for (const flow of flowsAsOrigin) {
            mergeFlows(flows, flow);
        }
        return flows;
    }, [flowsAsDestination, flowsAsOrigin]);

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

    // const destinationTree = useMemo(() => {
    //     const dag = dagStratify()(flowsAsDestination);
    //     return {
    //         // @ts-ignore
    //         size: layout(dag),
    //         steps: dag.size(),
    //         nodes: dag.descendants(),
    //         links: dag.links(),
    //     };
    // }, [flowsAsDestination, layout]);

    const originTree = useMemo(() => {
        if (flowsAsOrigin.length === 0) {
            return null;
        }
        const dag = dagStratify()(flowsAsOrigin);
        return {
            // @ts-ignore
            size: layout(dag),
            steps: dag.size(),
            nodes: dag.descendants(),
            links: dag.links(),
        };
    }, [flowsAsOrigin, layout]);

    const combinedTree = useMemo(() => {
        if (combinedFlows.length === 0) {
            return null;
        }
        const dag = dagStratify()(combinedFlows);
        return {
            // @ts-ignore
            size: layout(dag),
            steps: dag.size(),
            nodes: dag.descendants(),
            links: dag.links(),
        };
    }, [combinedFlows, layout]);

    const [brush, setBrush] = useState<IBrushSignalStore[]>([]);
    const [brushIdx, setBrushIdx] = useState<number>(-1);

    return (
        <SVGGroup onClick={e => e.stopPropagation()}>
            {field ? [combinedTree/*, destinationTree, originTree*/].map((tree, i) => tree ? (
                <svg key={i} viewBox={`0 0 ${tree.size.height} ${tree.size.width}`} strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                        <marker id="flow-arrow" viewBox="0 -5 10 10" refX={32} refY="0" markerWidth={3} markerHeight={3} orient="auto">
                            <path fill="none" stroke="#463782" strokeWidth={2} d="M0,-5L10,0L0,5" />
                        </marker>
                    </defs>
                    {tree.links.map((link, i, { length }) => (
                        <path
                            key={i}
                            d={line(link.points.map(p => ({ x: p.y, y: p.x }))) ?? ''}
                            fill="none"
                            stroke="#441ce3"
                            strokeWidth={0.03}
                            markerEnd="url(#flow-arrow)"
                            opacity={0.25}
                            style={{
                                filter: `hue-rotate(${180 * i / length}deg)`,
                            }}
                        />
                    ))}
                    {tree.nodes.map((node, i) => {
                        const idx = parseInt(node.data.id, 10);
                        const f = fields[idx];
                        return (
                            <g key={i} transform={`translate(${node.y ?? 0},${node.x ?? 0})`}>
                                <circle
                                    r={0.2}
                                    fill={idx === index ? "#995ccf" : "#463782"}
                                    stroke="none"
                                    strokeWidth="0"
                                    style={{ cursor: index === idx ? 'default' : 'pointer' }}
                                    onClick={e => {
                                        e.stopPropagation();
                                        if (index !== idx) {
                                            onClickNode?.({ nodeId: idx });
                                        }
                                    }}
                                />
                                <text fill="white" stroke="#463782" strokeWidth={0.001} fontWeight="bold" fontSize={0.05} textAnchor="middle" >
                                    {f.name ?? f.fid}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            ) : null) : null}
            {originTree ? (
                <div
                    style={{
                        width: `${FLOW_HEIGHT * originTree.size.height / originTree.size.width}px`,
                    }}
                >
                    <svg viewBox={`0 0 ${originTree.size.height} ${originTree.size.width}`} strokeLinecap="round" strokeLinejoin="round">
                        <defs>
                            <marker id="flow-arrow" viewBox="0 -5 10 10" refX={32} refY="0" markerWidth={3} markerHeight={3} orient="auto">
                                <path fill="none" stroke="#463782" strokeWidth={2} d="M0,-5L10,0L0,5" />
                            </marker>
                        </defs>
                        {originTree.links.map((link, i, { length }) => (
                            <path
                                key={i}
                                d={line(link.points.map(p => ({ x: p.y, y: p.x }))) ?? ''}
                                fill="none"
                                stroke="#441ce3"
                                strokeWidth={0.03}
                                markerEnd="url(#flow-arrow)"
                                opacity={0.25}
                                style={{
                                    filter: `hue-rotate(${180 * i / length}deg)`,
                                }}
                            />
                        ))}
                    </svg>
                    <div>
                        {originTree.nodes.map((node, i) => {
                            const idx = parseInt(node.data.id, 10);
                            const f = fields[idx];
                            return (
                                <div
                                    key={i}
                                    style={{
                                        left: `${(node.y ?? 0) / originTree.size.height * 100}%`,
                                        top: `${(node.x ?? 0) / originTree.size.width * 100}%`,
                                        width: `${0.4 * FLOW_HEIGHT / originTree.size.width}px`,
                                        height: `${0.4 * FLOW_HEIGHT / originTree.size.width}px`,
                                    }}
                                >
                                    <ColDist
                                        data={dataSource}
                                        actions={false}
                                        fid={f.fid}
                                        name={f.name}
                                        semanticType={f.semanticType}
                                        onBrushSignal={brush => {
                                            if (!brush) {
                                                return;
                                            }
                                            setBrush(brush);
                                            setBrushIdx(i);
                                        }}
                                        width={0.4 * FLOW_HEIGHT / originTree.size.width}
                                        height={0.4 * FLOW_HEIGHT / originTree.size.width}
                                        axis={null}
                                        brush={brushIdx === i ? null : brush}
                                    />
                                    <label
                                        style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: '50%',
                                            transform: 'translate(-50%, -0.4em)',
                                        }}
                                    >
                                        {f.name ?? f.fid}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : <div />}
        </SVGGroup>
    );
};


export default FlowAnalyzer;
