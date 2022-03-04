import { IFieldMeta } from "../interfaces";
export const geomTypeMap: { [key: string]: any } = {
    interval: "boxplot",
    line: "line",
    point: "point",
    // density: 'rect'
    density: "point"
};
const channels = [
    'x', 'y',
    'size',
    'color',
    'opacity',
    'rows',
    'columns'
];

const ch = {
    quantitative: ['x' , 'y', 'size', 'opacity', 'color'],
    ordinal: ['x', 'y', 'opacity', 'color', 'size', 'shape'],
    nominal: ['x', 'y', 'color', 'row', 'column', 'opacity', 'size', 'shape'],
    temporal: ['x', 'y', 'opacity', 'color', 'shape']
} as const;

const highOrderChannels = {
    dimension: ['row', 'column'],
    measure: ['repeat']
} as const;

// const highOrderChannels = {
//     quantitative: ['x' , 'y', 'size', 'opacity', 'color'],
//     ordinal: ['x', 'y', 'opacity', 'color', 'size', 'shape'],
//     nominal: ['x', 'y', 'color', 'opacity', 'size', 'shape'],
//     temporal: ['x', 'y', 'opacity', 'color', 'shape']
// }

interface BaseVisProps {
    // dataSource: DataSource;
    measures: IFieldMeta[];
}
function humanHabbit (encoding: any) {
    if (encoding.x && encoding.x.type !== 'temporal') {
        if (encoding.y && encoding.y.type === 'temporal') {
            const t = encoding.x;
            encoding.x = encoding.y;
            encoding.y = t;
        }
    }
}
function encode (fields: IFieldMeta[], usedChannels: Set<string> = new Set()) {
    const orderFields = [...fields];
    let encoding: any = {}
    // let inHighOrderStatus: typeof highOrderChannels = '';
    let inHighOrderStatus: keyof typeof highOrderChannels | null = null;
    let highOrderIndex: number = 0;
    console.log('[score]', orderFields)
    orderFields.sort((a, b) => b.features.entropy - a.features.entropy);

    for (let i = 0; i < orderFields.length; i++) {
        const chs = ch[orderFields[i].semanticType];
        let encoded: boolean = false;
        for (let j = 0; j < chs.length; j++) {
            if (!usedChannels.has(chs[j])) {
                encoding[chs[j]] = {
                    field: orderFields[i].fid,
                    type: orderFields[i].semanticType,
                }
                usedChannels.add(chs[j])
                encoded = true;
                break;
            }
        }
        if (!encoded) {
            inHighOrderStatus = orderFields[i].analyticType;
            if (inHighOrderStatus === 'dimension' && highOrderIndex < highOrderChannels[inHighOrderStatus].length) {
                encoding[highOrderChannels[inHighOrderStatus][highOrderIndex]] = {
                    field: orderFields[i].fid,
                    type: orderFields[i].semanticType
                }
                highOrderIndex++
            }
            // inHighOrderStatus = true;
        }
    }
    return encoding
}

function isSetEqual (a1: any[], a2: any[]) {
    const s1 = new Set(a1);
    const s2 = new Set(a2);
    if (s1.size !== s2.size) return false;
    for (let ele of s1) {
        if (!s2.has(ele)) return false;
    }
    return true;
}

function autoMark (fields: IFieldMeta[]) {
    const orderFields = [...fields];
    orderFields.sort((a, b) => b.features.entropy - a.features.entropy);
    const semantics = orderFields.slice(0, 2).map(f => f.semanticType)
    if (fields.length === 1) {
        return 'bar'
    }
    if (isSetEqual(semantics, ['nominal', 'nominal'])) {
        return 'text'
    } else if (isSetEqual(semantics, ['nominal', 'quantitative'])) {
        return 'bar'
    } else if (isSetEqual(semantics, ['ordinal', 'quantitative'])) {
        return 'point'
    } else  if (isSetEqual(semantics, ['nominal', 'ordinal'])) {
        return 'point'
    } else if (isSetEqual(semantics, ['quantitative', 'quantitative'])) {
        return 'point'
    } else if (isSetEqual(semantics, ['temporal', 'quantitative'])) {
        return 'line'
    }
    return 'point'
}

function markFixEncoding (markType: string, usedChannels: Set<string>) {
    if (markType === 'bar') {
        usedChannels.add('size');
        usedChannels.add('shape');
    }
}

function fastEncoding(fields: IFieldMeta[]) {
    let encoding: any = {}
    if (fields.length === 1) {
        encoding.x = {
            field: fields[0].fid,
            type: 'ordinal',
            bin: true
        }
        encoding.y = {
            aggregate: 'count'
        }
    } else {
        let usedFieldSize = Math.min(fields.length, channels.length);
        for (let i = 0; i < usedFieldSize; i++) {
            encoding[channels[i]] = {
                field: fields[i].fid,
                type: fields[i].semanticType
            }
        }
    }
    return encoding
}

function autoAgg (encoding: any, fields: IFieldMeta[], markType: string) {
    if (fields.length === 1) {
        if (fields[0].semanticType === 'quantitative') {
            encoding.x.bin = true;
            encoding.x.type = 'ordinal';
        }
        encoding.y = {
            aggregate: 'count'
        }
    } else {
        if (markType === 'bar' || markType === 'line') {
            if (encoding.x && encoding.x.type === 'quantitative') {
                encoding.x.aggregate = 'median'
            }
            if (encoding.y && encoding.y.type === 'quantitative') {
                encoding.y.aggregate = 'median'
            }
        }
    }
}

export function distVis(props: BaseVisProps) {
    const {
        // dataSource,
        // dimensions,
        measures,
    } = props;
    // let markType = measures.length === 1 ? 'bar' : 'point';
    const usedChannels: Set<string> = new Set();
    let markType = autoMark(measures)
    markFixEncoding(markType, usedChannels)
    const enc = encode(measures, usedChannels)
    autoAgg(enc, measures, markType)
    humanHabbit(enc);

    let basicSpec: any = {
        // width: chartWidth,\
        data: {
            name: 'dataSource'
            // values: dataSource
        },
        mark: {
            type: markType
        },
        // encoding: fastEncoding(measures)
        encoding: enc
    };


    return basicSpec;
}
