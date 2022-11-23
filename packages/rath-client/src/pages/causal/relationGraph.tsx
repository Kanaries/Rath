import React, { useEffect, useMemo, useRef } from 'react';
import embed from 'vega-embed';
import { IFieldMeta } from '../../interfaces';
interface RelationGraphProps {
    matrix: number[][];
    fields: IFieldMeta[]
}
interface IEdge {
    source: string; target: string
    value: number
}
interface INode {
    id: string;
    name: string;
    [key: string]: any
}
const RelationGraph: React.FC<RelationGraphProps> = props => {
    const { matrix, fields } = props;
    const container = useRef<HTMLDivElement>(null);
    const nodes = useMemo<INode[]>(() => {
        return fields.map((field, i) => ({
            id: field.fid,
            name: field.name || field.fid,
            group: i,
            parent: i === 0 ? undefined : fields[0].fid,
        }));
    }, [fields])
    const edges = useMemo<IEdge[]>(() => {
        const ans: IEdge[] = [];
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[i].length; j++) {
                if (matrix[i][j] > 0.1 && i !== j) {
                    ans.push({
                        source: fields[i].fid,
                        target: fields[j].fid,
                        value: matrix[i][j],
                    });
                }
            }
        }
        return ans;
    }, [matrix, fields]);
    useEffect(() => {
        if (container.current) {
            embed(container.current, {
                padding: 5,
                width: 720,
                height: 720,
                autosize: 'none',

                signals: [
                    {
                        name: 'tension',
                        value: 0.85,
                    },
                    {
                        name: 'radius',
                        value: 280,
                    },
                    {
                        name: 'extent',
                        value: 360,
                    },
                    {
                        name: 'rotate',
                        value: 0,
                    },
                    {
                        name: 'textSize',
                        value: 12,
                    },
                    {
                        name: 'textOffset',
                        value: 2,
                    },
                    {
                        name: 'layout',
                        value: 'cluster',
                        // bind: { input: 'radio', options: ['tidy', 'cluster'] },
                    },
                    { name: 'colorIn', value: 'firebrick' },
                    { name: 'colorOut', value: 'forestgreen' },
                    { name: 'originX', update: 'width / 2' },
                    { name: 'originY', update: 'height / 2' },
                    {
                        name: 'active',
                        value: null,
                        on: [
                            { events: 'text:mouseover', update: 'datum.id' },
                            { events: 'mouseover[!event.item]', update: 'null' },
                        ],
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
                                size: [1, 1],
                                as: ['alpha', 'beta', 'depth', 'children'],
                            },
                            {
                                type: 'formula',
                                expr: '(rotate + extent * datum.alpha + 270) % 360',
                                as: 'angle',
                            },
                            {
                                type: 'formula',
                                expr: 'inrange(datum.angle, [90, 270])',
                                as: 'leftside',
                            },
                            {
                                type: 'formula',
                                expr: 'originX + radius * datum.beta * cos(PI * datum.angle / 180)',
                                as: 'x',
                            },
                            {
                                type: 'formula',
                                expr: 'originY + radius * datum.beta * sin(PI * datum.angle / 180)',
                                as: 'y',
                            },
                        ],
                    },
                    {
                        name: 'leaves',
                        source: 'tree',
                        transform: [
                            {
                                type: 'filter',
                                expr: '!datum.children',
                            },
                        ],
                    },
                    {
                        name: 'dependencies',
                        values: edges,
                        transform: [
                            {
                                type: 'formula',
                                expr: "treePath('tree', datum.source, datum.target)",
                                as: 'treepath',
                                initonly: true,
                            },
                        ],
                    },
                    {
                        name: 'selected',
                        source: 'dependencies',
                        transform: [
                            {
                                type: 'filter',
                                expr: 'datum.source === active || datum.target === active',
                            },
                        ],
                    },
                ],

                marks: [
                    {
                        type: 'text',
                        from: { data: 'leaves' },
                        encode: {
                            enter: {
                                text: { field: 'name' },
                                baseline: { value: 'middle' },
                            },
                            update: {
                                x: { field: 'x' },
                                y: { field: 'y' },
                                dx: { signal: 'textOffset * (datum.leftside ? -1 : 1)' },
                                angle: { signal: 'datum.leftside ? datum.angle - 180 : datum.angle' },
                                align: { signal: "datum.leftside ? 'right' : 'left'" },
                                fontSize: { signal: 'textSize' },
                                fontWeight: [
                                    { test: "indata('selected', 'source', datum.id)", value: 'bold' },
                                    { test: "indata('selected', 'target', datum.id)", value: 'bold' },
                                    { value: null },
                                ],
                                fill: [
                                    { test: 'datum.id === active', value: 'black' },
                                    { test: "indata('selected', 'source', datum.id)", signal: 'colorIn' },
                                    { test: "indata('selected', 'target', datum.id)", signal: 'colorOut' },
                                    { value: 'black' },
                                ],
                            },
                        },
                    },
                    {
                        type: 'group',
                        from: {
                            facet: {
                                name: 'path',
                                data: 'dependencies',
                                field: 'treepath',
                            },
                        },
                        marks: [
                            {
                                type: 'line',
                                interactive: false,
                                from: { data: 'path' },
                                encode: {
                                    enter: {
                                        interpolate: { value: 'bundle' },
                                        strokeWidth: { value: 1.5 },
                                        stroke: {
                                            scale: 'colorEdge',
                                            field: 'value',
                                        },
                                    },
                                    update: {
                                        stroke: [
                                            { test: 'parent.source === active', signal: 'colorOut' },
                                            { test: 'parent.target === active', signal: 'colorIn' },
                                            // { test: 'parent.value > 0', value: 'red'},
                                            { scale: 'colorEdge', signal: 'parent.value' },
                                        ],
                                        // stroke: {
                                        //     scale: 'colorEdge',
                                        //     field: 'value',
                                        //     // value: 'red'
                                        // },
                                        strokeOpacity: [
                                            { test: 'parent.source === active || parent.target === active', value: 1 },
                                            { value: 0.2 },
                                        ],
                                        tension: { signal: 'tension' },
                                        x: { field: 'x' },
                                        y: { field: 'y' },
                                    },
                                },
                            },
                        ],
                    },
                ],

                scales: [
                    {
                        name: 'color',
                        type: 'ordinal',
                        domain: ['depends on', 'imported by'],
                        range: [{ signal: 'colorIn' }, { signal: 'colorOut' }],
                    },
                    {
                        "name": "colorEdge",
                        "type": "quantize",
                        "domain": {"data": "dependencies", "field": "value"},
                        "range": {"scheme": "yellowgreenblue"}
                      }
                ],

                legends: [
                    {
                        stroke: 'color',
                        orient: 'bottom-right',
                        title: 'Dependencies',
                        symbolType: 'stroke',
                    },
                ],
            });
        }
    }, [nodes, edges]);
    return <div ref={container}></div>;
};


export default RelationGraph;
