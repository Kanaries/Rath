import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { IDBGraph } from './localTypes';
const BOX_WIDTH = 120;
const BOX_HEIGHT = 40;
const DBBox = styled.div`
    width: ${BOX_WIDTH}px;
    height: ${BOX_HEIGHT}px;
    background-color: #fff;
    border: 1px solid #555;
    position: absolute;
    border-radius: 5px;
    box-shadow: 0 0 5px #888;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    &:hover {
        background-color: #eee;
    }
`;
function getBoxRightPoint(x: number, y: number) {
    return [x + BOX_WIDTH, y + BOX_HEIGHT / 2];
}

function getBoxLeftPoint(x: number, y: number) {
    return [x, y + BOX_HEIGHT / 2];
}

function getMidPoint(x1: number, y1: number, x2: number, y2: number): [number, number] {
    return [(x1 + x2) / 2, (y1 + y2) / 2];
}

const testGraph: IDBGraph = {
    nodes: [
        {
            id: '1',
            label: 'Table1',
            x: 100,
            y: 100,
        },
        {
            id: '2',
            label: 'Table2',
            x: 200,
            y: 300,
        },
        {
            id: '3',
            label: 'Table3',
            x: 400,
            y: 200,
        },
        {
            id: '4',
            label: 'Table4',
            x: 300,
            y: 500,
        },
    ],
    edges: [
        {
            from: '1',
            to: '2',
            label: 'edge1',
        },
        {
            from: '1',
            to: '3',
            label: 'edge2',
        },
        {
            from: '3',
            to: '4',
            label: 'edge3',
        },
    ],
};


const DbGraph: React.FC = () => {
    const width = 800;
    const height = 600;
    const container = useRef<HTMLDivElement>(null);
    const [graph, setGraph] = useState(testGraph);
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const fixes = useRef<{x: number; y: number}>({ x: 0, y: 0 })

    const updateNodePosition = (id: string | null, x: number, y: number) => {
        if (id === null)return;
        const newGraph = { ...graph };
        const node = newGraph.nodes.find((n) => n.id === id);
        if (node) {
            node.x = x;
            node.y = y;
        }
        setGraph(newGraph);
    };

    return (
        <div ref={container} style={{ width: `${width}px`, height: `${height}px`, position: 'relative' }}
        onDrop={(e) => {
            e.stopPropagation()
            if (container.current && draggingNodeId) {
                const contRect = container.current.getBoundingClientRect()
                updateNodePosition(draggingNodeId, e.clientX + fixes.current.x - contRect.left , e.clientY + fixes.current.y - contRect.top);
                setDraggingNodeId(null);

            }
        }}
        onDragOver={e => {
            e.preventDefault()
            if (container.current && draggingNodeId) {
                const contRect = container.current.getBoundingClientRect()
                updateNodePosition(draggingNodeId, e.clientX + fixes.current.x - contRect.left , e.clientY + fixes.current.y - contRect.top);

            }
        }}>
            <svg width={`${width}px`} height={`${height}px`}>
                {graph.edges.map((edge, index) => {
                    const fromNode = graph.nodes.find((node) => node.id === edge.from);
                    const toNode = graph.nodes.find((node) => node.id === edge.to);
                    if (!fromNode || !toNode) {
                        return null;
                    }
                    const fromPoint = getBoxRightPoint(fromNode.x, fromNode.y);
                    const toPoint = getBoxLeftPoint(toNode.x, toNode.y);
                    const midPoint = getMidPoint(fromPoint[0], fromPoint[1], toPoint[0], toPoint[1]);
                    return (
                        <g key={index}>
                            <path
                                // d={`M ${fromPoint[0]} ${fromPoint[1]}  Q ${midPoint[0]} ${midPoint[1]} ${toPoint[0]} ${toPoint[1]}`}
                                d={`M ${fromPoint[0]} ${fromPoint[1]} C ${toPoint[0]} ${fromPoint[1]} ${fromPoint[0]} ${toPoint[1]} ${toPoint[0]} ${toPoint[1]}`}
                                stroke="#868686"
                                strokeOpacity="1"
                                fill="none"
                                pointerEvents="visibleStroke"
                                fillOpacity="1"
                                className={`line selected`}
                                style={{ strokeWidth: 2, cursor: 'pointer' }}
                            />
                            <circle cx={midPoint[0]} cy={midPoint[1]} r="5" fill="#333" />
                        </g>
                    );
                })}
                {/* <path
                    stroke="#868686"
                    strokeOpacity="1"
                    fill="none"
                    pointerEvents="visibleStroke"
                    fillOpacity="1"
                    className={`line selected`}
                    style={{ strokeWidth: 2, cursor: 'pointer' }}
                    d={`M ${getBoxRightPoint(pointA[0], pointA[1])} Q ${getMidPoint(pointA[0], pointA[1], pointB[0], pointB[1])} ${getBoxLeftPoint(pointB[0], pointB[1])}`}
                ></path> */}
            </svg>
            {graph.nodes.map((node, index) => {
                return (
                    <DBBox id={`db-node-${node.id}`} draggable key={index} style={{ left: `${node.x}px`, top: `${node.y}px` }}
                        onDragStart={(e) => {
                            setDraggingNodeId(node.id)
                            fixes.current.x = e.currentTarget.getBoundingClientRect().left - e.clientX
                            fixes.current.y = e.currentTarget.getBoundingClientRect().top - e.clientY
                        }}
                    >
                        {node.label}
                    </DBBox>
                );
            })}
            {/* <DBBox style={{ position: 'absolute', top: pointA[1] + 'px', left: pointA[0] + 'px' }}></DBBox>
            <DBBox style={{ position: 'absolute', top: pointB[1] + 'px', left: pointB[0] + 'px' }}></DBBox> */}
        </div>
    );
};

export default DbGraph;
