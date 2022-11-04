import { FC, useMemo } from "react";
import { dagStratify, sugiyama, decrossOpt } from 'd3-dag';
import { line as d3Line/*, curveCatmullRom*/, curveMonotoneY } from 'd3-shape';
import styled from "styled-components";
import type { IFieldMeta } from "../../../interfaces";
import { deepcopy } from "../../../utils";
import type { DiagramGraphData } from ".";


export interface FlowAnalyzerProps {
    // full: readonly Flow[];
    fields: readonly Readonly<IFieldMeta>[];
    data: DiagramGraphData;
    index: number;
    cutThreshold: number;
}

export type Flow = {
    id: string;
    parentIds: string[];
};

export const mergeFlows = (flows: Flow[], entering: Flow): void => {
    const item = flows.find(f => f.id === entering.id);
    if (item) {
        item.parentIds.push(...entering.parentIds);
        item.parentIds = [...new Set(item.parentIds)];
    } else {
        flows.push(entering);
    }
};

const SVGGroup = styled.div`
    display: flex;
    width: 100%;
    height: 400px;
    > svg {
        flex: 1;
    }
`;

const line = d3Line<{ x: number; y: number }>().curve(curveMonotoneY).x(d => d.x).y(d => d.y);

// FIXME: 这个模块有 bug，cutThreshold 调低时会卡死（疑似解析 dag 时死循环）
const FlowAnalyzer: FC<FlowAnalyzerProps> = ({ fields, data, index, cutThreshold }) => {
    const field = useMemo(() => fields.at(index), [fields, index]);

    const normalizedLinks = useMemo(() => {
        const max = data.links.reduce<number>((m, d) => m > d.score ? m : d.score, 0);
        return data.links.map(link => ({
            ...link,
            score: link.score / (max || 1),
        }));
    }, [data.links]);

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
                    if (link.causeId === source) {
                        if (link.score >= cutThreshold) {
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
                    if (link.effectId === source) {
                        if (link.score >= cutThreshold) {
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

    // console.log(flowsAsDestination, flowsAsOrigin);

    const combinedFlows = useMemo(() => {
        const flows = deepcopy(flowsAsDestination) as typeof flowsAsDestination;
        for (const flow of flowsAsOrigin) {
            mergeFlows(flows, flow);
        }
        return flows;
    }, [flowsAsDestination, flowsAsOrigin]);

    const layout = useMemo(() => {
        return sugiyama().decross(decrossOpt())//.nodeSize(node => [node ? 5 : 1, 3]);
    }, []);

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
        const dag = dagStratify()(combinedFlows);
        return {
            // @ts-ignore
            size: layout(dag),
            steps: dag.size(),
            nodes: dag.descendants(),
            links: dag.links(),
        };
    }, [combinedFlows, layout]);

    return field ? (
        <SVGGroup>
            {[combinedTree, destinationTree, originTree].map((tree, i) => (
                <svg key={i} viewBox={`0 0 ${tree.size.width} ${tree.size.height}`} strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                        <marker id="flow-arrow" viewBox="0 -5 10 10" refX={23} refY="0" markerWidth={3} markerHeight={3} orient="auto">
                            <path fill="none" stroke="#9c94bb" strokeWidth={2} d="M0,-5L10,0L0,5" />
                        </marker>
                    </defs>
                    {tree.links.map((link, i) => (
                        <path
                            key={i}
                            d={line(link.points) ?? ''}
                            fill="none"
                            stroke="#9c94bb"
                            strokeWidth={0.05}
                            markerEnd="url(#flow-arrow)"
                        />
                    ))}
                    {tree.nodes.map((node, i) => {
                        const idx = parseInt(node.data.id, 10);
                        const f = fields[idx];
                        return (
                            <g key={i} transform={`translate(${node.x ?? 0},${node.y ?? 0})`}>
                                <circle r={0.2} fill={idx === index ? "#995ccf" : "#463782"} stroke="none" />
                                <text fill="white" stroke="#463782" strokeWidth={0.001} fontWeight="bold" fontSize={0.05} textAnchor="middle" >
                                    {f.name ?? f.fid}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            ))}
        </SVGGroup>
    ) : null;
};


export default FlowAnalyzer;
