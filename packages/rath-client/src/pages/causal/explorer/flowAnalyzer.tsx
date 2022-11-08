/* eslint no-fallthrough: ["error", { "allowEmptyCase": true }] */
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Dropdown } from "@fluentui/react";
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
        height: 50vh;
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
    > div:not(.tools) {
        flex-grow: 0;
        flex-shrink: 0;
        display: flex;
        position: relative;
        width: 100%;
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
        const nodeCauseWeights = data.nodes.map(() => 0);
        const nodeEffectWeights = data.nodes.map(() => 0);
        data.links.forEach(link => {
            nodeCauseWeights[link.effectId] += link.score;
            nodeEffectWeights[link.causeId] += link.score;
        });
        return data.links.map(link => ({
            causeId: link.causeId,
            effectId: link.effectId,
            score: link.score / nodeCauseWeights[link.effectId],
            type: link.type,
        })).filter(link => link.score >= cutThreshold);
    }, [data, cutThreshold]);

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
                    switch (link.type) {
                        case 'directed':
                        case 'weak directed': {
                            if (link.causeId === source) {
                                mergeFlows(flows, {
                                    id: `${link.effectId}`,
                                    parentIds: [`${link.causeId}`],
                                });
                                mergeFlows(flows, {
                                    id: `${link.causeId}`,
                                    parentIds: [],
                                });
                                ready.push(link.effectId);
                            } else {
                                nextLinks.push(link);
                            }
                            break;
                        }
                        case 'bidirected':
                        case 'undirected': {
                            if (link.causeId === source) {
                                mergeFlows(flows, {
                                    id: `${link.effectId}`,
                                    parentIds: [`${link.causeId}`],
                                });
                                mergeFlows(flows, {
                                    id: `${link.causeId}`,
                                    parentIds: [],
                                });
                                ready.push(link.effectId);
                            } else if (link.effectId === source) {
                                mergeFlows(flows, {
                                    id: `${link.causeId}`,
                                    parentIds: [`${link.effectId}`],
                                });
                                mergeFlows(flows, {
                                    id: `${link.effectId}`,
                                    parentIds: [],
                                });
                                ready.push(link.causeId);
                            } else {
                                nextLinks.push(link);
                            }
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                }
                links = nextLinks;
            }
            return flows;
        }
        return [];
    }, [normalizedLinks, field, index]);

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
                    switch (link.type) {
                        case 'directed':
                        case 'weak directed': {
                            if (link.effectId === source) {
                                mergeFlows(flows, {
                                    id: `${link.effectId}`,
                                    parentIds: [`${link.causeId}`],
                                });
                                mergeFlows(flows, {
                                    id: `${link.causeId}`,
                                    parentIds: [],
                                });
                                ready.push(link.causeId);
                            } else {
                                nextLinks.push(link);
                            }
                            break;
                        }
                        case 'bidirected':
                        case 'undirected': {
                            if (link.effectId === source) {
                                mergeFlows(flows, {
                                    id: `${link.effectId}`,
                                    parentIds: [`${link.causeId}`],
                                });
                                mergeFlows(flows, {
                                    id: `${link.causeId}`,
                                    parentIds: [],
                                });
                                ready.push(link.causeId);
                            } else if (link.causeId === source) {
                                mergeFlows(flows, {
                                    id: `${link.causeId}`,
                                    parentIds: [`${link.effectId}`],
                                });
                                mergeFlows(flows, {
                                    id: `${link.effectId}`,
                                    parentIds: [],
                                });
                                ready.push(link.effectId);
                            } else {
                                nextLinks.push(link);
                            }
                            break;
                        }
                        default: {
                            break;
                        }
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

    const destinationTree = useMemo(() => {
        const dag = dagStratify()(flowsAsDestination);
        return {
            // @ts-ignore
            size: layout(dag),
            steps: dag.size(),
            nodes: dag.descendants(),
            links: dag.links(),
        };
    }, [flowsAsDestination, layout]);

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

    const [mode, setMode] = useState<'cause' | 'effect'>('effect');

    const subtree = useMemo(() => mode === 'cause' ? destinationTree : originTree, [mode, destinationTree, originTree]);

    const [brush, setBrush] = useState<IBrushSignalStore[]>([]);
    const [brushIdx, setBrushIdx] = useState<number>(-1);

    const ref = useRef<HTMLDivElement>(null);

    // 没写反，就是横过来
    const w = (subtree?.size.height ?? 0) + 1;
    const h = (subtree?.size.width ?? 0) + 1;

    const [width, setWidth] = useState(0);

    const [fx, fy, fSize] = useMemo<[(x: number) => number, (y: number) => number, (size: number) => number]>(() => {
        if (w / width >= h / FLOW_HEIGHT) {
            const scale = width / w;
            const yl = h * scale;
            const yPad = (FLOW_HEIGHT - yl) / 2;
            return [
                x => (x + 0.5) * scale,
                y => yPad + (y + 0.5) * scale,
                size => size * scale,
            ];
        } else {
            const scale = FLOW_HEIGHT / h;
            const xl = w * scale;
            const xPad = (width - xl) / 2;
            return [
                x => xPad + (x + 0.5) * scale,
                y => (y + 0.5) * scale,
                size => size * scale,
            ];
        }
    }, [w, h, width]);

    useEffect(() => {
        const { current: container } = ref;
        if (subtree && container) {
            const cb = () => {
                const { width: w } = container.getBoundingClientRect();
                setWidth(w);
            };
            const ro = new ResizeObserver(cb);
            ro.observe(container);
            return () => ro.disconnect();
        }
    }, [subtree]);

    return (
        <SVGGroup onClick={e => e.stopPropagation()}>
            {field ? [combinedTree/*, destinationTree, originTree*/].map((tree, i) => tree ? (
                <svg key={i} viewBox={`0 0 ${tree.size.height + 1} ${tree.size.width + 1}`} strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                        <marker id="flow-arrow" viewBox="0 -5 10 10" refX={32} refY="0" markerWidth={3} markerHeight={3} orient="auto">
                            <path fill="none" stroke="#463782" strokeWidth={2} d="M0,-5L10,0L0,5" />
                        </marker>
                    </defs>
                    {tree.links.map((link, i, { length }) => (
                        <path
                            key={i}
                            d={line(link.points.map(p => ({ x: p.y + 0.5, y: p.x + 0.5 }))) ?? ''}
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
                            <g key={i} transform={`translate(${(node.y ?? 0) + 0.5},${(node.x ?? 0) + 0.5})`}>
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
            {field && (
                <div className="tools" style={{ width: '100%', padding: '1em 4em' }}>
                    <Dropdown
                        label="Exploration Mode"
                        selectedKey={mode}
                        onChange={(e, option) => {
                            const key = option?.key as undefined | typeof mode;
                            if (key) {
                                setMode(key);
                            }
                        }}
                        options={[
                            { key: 'cause', text: `How ${field.name ?? field.fid} is effected by other fields` },
                            { key: 'effect', text: `How ${field.name ?? field.fid} effects other fields` },
                        ]}
                        styles={{
                            root: {
                                width: '26em',
                            }
                        }}
                    />
                    {subtree ? null : (
                        <p>Click a node to explore.</p>
                    )}
                </div>
            )}
            {subtree ? (
                <div ref={ref}>
                    <svg viewBox={`0 0 ${w} ${h}`} strokeLinecap="round" strokeLinejoin="round">
                        <defs>
                            <marker id="flow-arrow" viewBox="0 -5 10 10" refX={32} refY="0" markerWidth={3} markerHeight={3} orient="auto">
                                <path fill="none" stroke="#463782" strokeWidth={2} d="M0,-5L10,0L0,5" />
                            </marker>
                        </defs>
                        {subtree.links.map((link, i, { length }) => (
                            <path
                                key={i}
                                d={line(link.points.map(p => ({ x: p.y + 0.5, y: p.x + 0.5 }))) ?? ''}
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
                        {subtree.nodes.map((node, i) => {
                            const idx = parseInt(node.data.id, 10);
                            const f = fields[idx];
                            return (
                                <div
                                    key={i}
                                    style={{
                                        left: `${fx(node.y ?? 0)}px`,
                                        top: `${fy(node.x ?? 0)}px`,
                                        width: `${fSize(0.6)}px`,
                                        height: `${fSize(0.6)}px`,
                                        borderColor: index === idx ? '#995ccf' : undefined,
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
                                        width={fSize(0.6)}
                                        height={fSize(0.6)}
                                        axis={null}
                                        brush={brushIdx === i ? null : brush}
                                    />
                                    <label
                                        style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: '50%',
                                            transform: 'translate(-50%, -0.4em)',
                                            cursor: index === idx ? 'default' : 'pointer',
                                            color: index === idx ? '#995ccf' : '#5da3dc',
                                            fontWeight: 550,
                                        }}
                                        onClick={() => {
                                            if (index !== idx) {
                                                onClickNode?.({ nodeId: idx });
                                            }
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
