import React, { useEffect, useMemo, useRef } from 'react';
import embed from 'vega-embed';
import { IFieldMeta } from '../../../interfaces';

interface RelationTreeProps {
    matrix: number[][];
    fields: IFieldMeta[];
    focusIndex: number;
    onFocusChange: (index: number) => void;
}
interface INode {
    id: string;
    name: string;
    parent?: string;
    [key: string]: any;
}

function matrix2Tree(mat: number[][], fields: IFieldMeta[], focusIndex: number): INode[] {
    const nodes: INode[] = [];
    const rootField = fields[focusIndex];
    const been: boolean[] = fields.map(f => false);
    been[focusIndex] = true
    const queue: INode[] = [
        {
            id: rootField.fid,
            name: rootField.name || rootField.fid,
            size: 0
        }
    ];
    while (queue.length > 0) {
        const node = queue.shift()!;
        nodes.push(node);
        const index = fields.findIndex((f) => f.fid === node.id);
        const row = mat[index];
        for (let i = 0; i < row.length; i++) {
            if (row[i] > 0 && i !== index && been[i] === false) {
                const child = {
                    id: fields[i].fid,
                    name: fields[i].name || fields[i].fid,
                    parent: node.id,
                    size: row[i],
                };
                // nodes.push(child);
                queue.push(child);
                been[i] = true;
            }
        }
    }
    return nodes;
}
const RelationTree: React.FC<RelationTreeProps> = (props) => {
    const { matrix, fields, focusIndex, onFocusChange } = props;
    const container = useRef<HTMLDivElement>(null);
    // const [focusNodeIndex, setFocusNodeIndex] = useState<number>(0);
    const nodes = useMemo<INode[]>(() => {
        return matrix2Tree(matrix, fields, focusIndex)
    }, [fields, matrix, focusIndex]);
    useEffect(() => {
        if (container.current) {
            embed(container.current, {
                width: 600,
                height: 800,
                padding: 5,

                signals: [
                    {
                        name: 'labels',
                        value: true,
                    },
                    {
                        name: 'layout',
                        value: 'tidy',
                    },
                    {
                        name: 'links',
                        value: 'diagonal',
                    },
                    {
                        name: 'separation',
                        value: false,
                    },
                ],

                data: [
                    {
                        name: 'tree',
                        values: nodes,
                        transform: [
                            {
                                type: 'stratify',
                                key: 'id',
                                parentKey: 'parent',
                            },
                            {
                                type: 'tree',
                                method: { signal: 'layout' },
                                size: [{ signal: 'height' }, { signal: 'width - 100' }],
                                separation: { signal: 'separation' },
                                as: ['y', 'x', 'depth', 'children'],
                            },
                        ],
                    },
                    {
                        name: 'links',
                        source: 'tree',
                        transform: [
                            { type: 'treelinks' },
                            {
                                type: 'linkpath',
                                orient: 'horizontal',
                                shape: { signal: 'links' },
                            },
                        ],
                    },
                ],

                scales: [
                    {
                        name: 'color',
                        type: 'linear',
                        range: { scheme: 'magma' },
                        domain: { data: 'tree', field: 'depth' },
                        zero: true,
                    },
                ],

                marks: [
                    {
                        type: 'path',
                        from: { data: 'links' },
                        encode: {
                            update: {
                                path: { field: 'path' },
                                stroke: { value: '#ccc' },
                            },
                        },
                    },
                    {
                        type: 'symbol',
                        from: { data: 'tree' },
                        encode: {
                            enter: {
                                size: { value: 100 },
                                stroke: { value: '#fff' },
                            },
                            update: {
                                x: { field: 'x' },
                                y: { field: 'y' },
                                fill: { scale: 'color', field: 'depth' },
                            },
                        },
                    },
                    {
                        type: 'text',
                        from: { data: 'tree' },
                        encode: {
                            enter: {
                                text: { field: 'name' },
                                fontSize: { value: 9 },
                                baseline: { value: 'middle' },
                            },
                            update: {
                                x: { field: 'x' },
                                y: { field: 'y' },
                                dx: { signal: 'datum.children ? -7 : 7' },
                                align: { signal: "datum.children ? 'right' : 'left'" },
                                opacity: { signal: 'labels ? 1 : 0' },
                            },
                        },
                    },
                ],
            }).then(res => {
                res.view.addEventListener('click', (e, item) => {
                    if (item && item.datum) {
                        onFocusChange(fields.findIndex(f => f.fid === item.datum.id))
                    }
                })
            })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, fields]);
    return <div ref={container}></div>;
};

export default RelationTree;
