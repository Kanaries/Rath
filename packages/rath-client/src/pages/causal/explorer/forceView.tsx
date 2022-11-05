import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    forceCenter,
    forceCollide,
    forceLink,
    forceManyBody,
    forceSimulation,
    SimulationLinkDatum,
    SimulationNodeDatum,
} from "d3-force";
import styled, { StyledComponentProps } from "styled-components";
import type { IFieldMeta } from "../../../interfaces";
import type { DiagramGraphData } from ".";


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

export type ForceViewProps = Omit<StyledComponentProps<'div', {}, {
    fields: readonly Readonly<IFieldMeta>[];
    value: Readonly<DiagramGraphData>;
    cutThreshold: number;
    mode: "explore" | "edit";
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

const NODE_RADIUS = 2;
const LINK_WIDTH = 0.04;
const LINK_OPACITY = 0.6;

const ForceView = forwardRef<HTMLDivElement, ForceViewProps>(({ fields, value, onChange, onFocusChange, cutThreshold, mode, ...props }, ref) => {
    const [selected, setSelected] = useState<number>(-1);
    const [[ w, h ], setSize] = useState<[number, number]>([0, 0]);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const nodes = useMemo<SimulationNodeDatum[]>(() => value.nodes.map(node => ({ index: node.nodeId })), [value.nodes]);
    const links = useMemo<SimulationLinkDatum<SimulationNodeDatum>[]>(() => value.links.map(link => ({ source: link.causeId, target: link.effectId })), [value.links]);

    const ticked = useCallback(() => {
        const { current: canvas } = canvasRef;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, w, h);
            ctx.save();
            ctx.globalAlpha = LINK_OPACITY;
            for (const [i, link] of links.entries()) {
                ctx.beginPath();
                // console.log(link);
                // @ts-ignore
                ctx.moveTo(link.source.x, link.source.y);
                // @ts-ignore
                ctx.lineTo(link.target.x, link.target.y);
                ctx.strokeStyle = '#888';
                ctx.lineWidth = LINK_WIDTH * Math.min(w, h) / 100;
                ctx.stroke();
            }
            ctx.restore();
            ctx.save();
            ctx.strokeStyle = '#444';
            ctx.globalAlpha = 1;
            for (const [i, node] of nodes.entries()) {
                if (node.x === undefined || node.y === undefined) {
                    continue;
                }
                ctx.beginPath();
                ctx.moveTo(node.x + NODE_RADIUS, node.y);
                ctx.arc(node.x, node.y, NODE_RADIUS * Math.min(w, h) / 100, 0, 2 * Math.PI);
                ctx.fillStyle = '#647839';
                ctx.stroke();
                ctx.fill();
            }
            ctx.restore();
        }
    }, [w, h, nodes, links]);

    useEffect(() => {
        const simulation = forceSimulation(nodes).force(
            'link', forceLink(links).id(({ index: i }) => i === undefined ? -1 : value.nodes[i].nodeId).strength(0.1 / NODE_RADIUS),
        ).force(
            'charge', forceManyBody(),
        ).force(
            'center', forceCenter(w / 2, h / 2),
        ).force(
            'collide', forceCollide(NODE_RADIUS * Math.min(w, h) / 100),
        ).on(
            'tick', ticked,
        );

        return () => {
            simulation.stop();
        };
    }, [nodes, links, value.nodes, w, h, ticked]);

    useEffect(() => {
        const { current: canvas } = canvasRef;
        const container = canvas?.parentElement;
        if (canvas && container) {
            const cb = () => {
                const { width, height } = container.getBoundingClientRect();
                if (width !== w || height !== h) {
                    setSize([width, height]);
                }
            };
            cb();
            const ro = new ResizeObserver(cb);
            ro.observe(container);
            return () => ro.disconnect();
        }
    }, [w, h]);

    // useEffect(() => {
    //     setSelected(-1);
    // }, [data]);

    useEffect(() => {
        onFocusChange(selected);
    }, [selected, onFocusChange]);

    return (
        <Container ref={ref} {...props}>
            <canvas ref={canvasRef} width={w} height={h}>
                
            </canvas>
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
        </Container>
    );
});


export default ForceView;
