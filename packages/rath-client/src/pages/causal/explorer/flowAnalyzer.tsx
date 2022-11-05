import { FC, useMemo } from "react";
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
import type { IFieldMeta } from "../../../interfaces";
import { deepcopy } from "../../../utils";
import type { DiagramGraphData } from ".";


export interface FlowAnalyzerProps {
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
    } else {
        flows.push(entering);
    }
};

const SVGGroup = styled.div`
    flex-grow: 0;
    flex-shrink: 0;
    display: flex;
    width: 100%;
    height: 30vh;
    border: 1px solid #8888;
    > svg {
        flex: 1;
    }
`;

const line = d3Line<{ x: number; y: number }>().curve(curveCatmullRom).x(d => d.x).y(d => d.y);

const FlowAnalyzer: FC<FlowAnalyzerProps> = ({ fields, data, index, cutThreshold }) => {
    const field = useMemo<IFieldMeta | undefined>(() => fields[index], [fields, index]);

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
                        if (link.score > 0 && link.score >= cutThreshold) {
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
                        if (link.score > 0 && link.score >= cutThreshold) {
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

    // const originTree = useMemo(() => {
    //     const dag = dagStratify()(flowsAsOrigin);
    //     return {
    //         // @ts-ignore
    //         size: layout(dag),
    //         steps: dag.size(),
    //         nodes: dag.descendants(),
    //         links: dag.links(),
    //     };
    // }, [flowsAsOrigin, layout]);

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

    return (
        <SVGGroup>
            {field ? [combinedTree/*, destinationTree, originTree*/].map((tree, i) => tree ? (
                <svg key={i} viewBox={`0 0 ${tree.size.height} ${tree.size.width}`} strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                        <marker id="flow-arrow" viewBox="0 -5 10 10" refX={32} refY="0" markerWidth={3} markerHeight={3} orient="auto">
                            <path fill="none" stroke="#9c94bb" strokeWidth={2} d="M0,-5L10,0L0,5" />
                        </marker>
                    </defs>
                    {tree.links.map((link, i) => (
                        <path
                            key={i}
                            d={line(link.points.map(p => ({ x: p.y, y: p.x }))) ?? ''}
                            fill="none"
                            stroke="#9c94bb"
                            strokeWidth={0.03}
                            markerEnd="url(#flow-arrow)"
                        />
                    ))}
                    {tree.nodes.map((node, i) => {
                        const idx = parseInt(node.data.id, 10);
                        const f = fields[idx];
                        return (
                            <g key={i} transform={`translate(${node.y ?? 0},${node.x ?? 0})`}>
                                <circle r={0.2} fill={idx === index ? "#995ccf" : "#463782"} stroke="none" />
                                <text fill="white" stroke="#463782" strokeWidth={0.001} fontWeight="bold" fontSize={0.05} textAnchor="middle" >
                                    {f.name ?? f.fid}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            ) : null) : null}
        </SVGGroup>
    );
};


export default FlowAnalyzer;
