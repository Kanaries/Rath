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
import { getRange } from "../../../utils";
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
    focus: number | null;
    /** 这个其实没有实现，现在 canvas 里没有绑定点 */
    onClickNode?: (node: DiagramGraphData['nodes'][number]) => void;
}, never>, 'onChange'>;

const NODE_RADIUS = 2;
const LINK_WIDTH = 0.6;
const LINK_OPACITY = 0.8;

const ForceView = forwardRef<HTMLDivElement, ForceViewProps>(({ fields, value, focus, onClickNode, cutThreshold, mode, ...props }, ref) => {
    const [[ w, h ], setSize] = useState<[number, number]>([0, 0]);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const nodes = useMemo<SimulationNodeDatum[]>(() => value.nodes.map(node => ({ index: node.nodeId })), [value.nodes]);

    const normalizedLinks = useMemo(() => {
        const max = value.links.reduce<number>((m, d) => m > d.score ? m : d.score, 0);
        return value.links.map((link, i) => ({
            ...link,
            score: value.links[i].score / (max || 1),
        }));
    }, [value.links]);

    const links = useMemo<SimulationLinkDatum<SimulationNodeDatum>[]>(() => normalizedLinks.filter(
        link => link.score > 0 && link.score >= cutThreshold
    ).map(
        link => ({ source: link.causeId, target: link.effectId })
    ), [cutThreshold, normalizedLinks]);

    const ticked = useCallback(() => {
        const { current: canvas } = canvasRef;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            const [x1, x2] = getRange(nodes.map(node => node.x ?? 0));
            const [y1, y2] = getRange(nodes.map(node => node.y ?? 0));
            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2;
            const _w = x2 - x1;
            const _h = y2 - y1;
            let fx = (x: number) => x;
            let fy = (y: number) => y;
            let scale = 1;
            if (_w && _h) {
                scale = (_w / w >= _h / h ? _w / w : _h / h) / 0.8;
                fx = x => (x - cx) / scale + 0.5 * w;
                fy = y => (y - cy) / scale + 0.5 * h;
            }
            ctx.clearRect(0, 0, w, h);
            ctx.save();
            ctx.globalAlpha = LINK_OPACITY;
            for (const [, link] of links.entries()) {
                ctx.beginPath();
                // console.log(link);
                // @ts-ignore
                ctx.moveTo(fx(link.source.x), fy(link.source.y));
                // @ts-ignore
                ctx.lineTo(fx(link.target.x), fy(link.target.y));
                ctx.strokeStyle = '#888';
                ctx.lineWidth = LINK_WIDTH * Math.min(w, h) / 100;
                ctx.stroke();
            }
            ctx.restore();
            ctx.save();
            ctx.strokeStyle = '#444';
            ctx.globalAlpha = 1;
            for (const [, node] of nodes.entries()) {
                if (node.x === undefined || node.y === undefined) {
                    continue;
                }
                ctx.beginPath();
                ctx.moveTo(fx(node.x + NODE_RADIUS), fy(node.y));
                ctx.arc(fx(node.x), fy(node.y), NODE_RADIUS / scale * Math.min(w, h) / 100, 0, 2 * Math.PI);
                ctx.fillStyle = '#a6eac7';
                ctx.stroke();
                ctx.fill();
            }
            ctx.restore();
        }
    }, [w, h, nodes, links]);

    useEffect(() => {
        const simulation = forceSimulation(nodes).force(
            'link', forceLink(links).id(({ index: i }) => i === undefined ? -1 : value.nodes[i].nodeId).strength(0.4 / links.length ** 0.5 / NODE_RADIUS),
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

    return (
        <Container ref={ref} {...props}>
            <canvas ref={canvasRef} width={w} height={h} />
        </Container>
    );
});


export default ForceView;
