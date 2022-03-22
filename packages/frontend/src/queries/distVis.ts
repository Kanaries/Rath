import { IPattern } from "../dev";
import { IFieldMeta } from "../interfaces";
export const geomTypeMap: { [key: string]: any } = {
    interval: "boxplot",
    line: "line",
    point: "point",
    // density: 'rect'
    density: "point"
};

const channels = {
    quantitative: ['x' , 'y', 'size', 'opacity', 'color'],
    ordinal: ['x', 'y', 'opacity', 'color', 'size', 'shape'],
    nominal: ['x', 'y', 'color', 'row', 'column', 'opacity', 'size', 'shape'],
    temporal: ['x', 'y', 'opacity', 'color', 'shape']
} as const;

const highOrderChannels = {
    dimension: ['row', 'column'],
    measure: ['repeat']
} as const;

interface BaseVisProps {
    // dataSource: DataSource;
    pattern: IPattern
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
    let inHighOrderStatus: keyof typeof highOrderChannels | null = null;
    let highOrderIndex: number = 0;
    orderFields.sort((a, b) => b.features.entropy - a.features.entropy);

    for (let i = 0; i < orderFields.length; i++) {
        const chs = channels[orderFields[i].semanticType];
        let encoded: boolean = false;
        for (let j = 0; j < chs.length; j++) {
            if (!usedChannels.has(chs[j])) {
                encoding[chs[j]] = {
                    field: orderFields[i].fid,
                    type: orderFields[i].semanticType,
                    title: orderFields[i].name || orderFields[i].fid
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
        return 'circle'
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

function autoAgg (encoding: any, fields: IFieldMeta[], markType: string, op: string = 'mean') {
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
                encoding.x.aggregate = op;
                if (encoding.x.title) {
                    encoding.x.title = `${op}(${encoding.x.title})`
                }
            }
            if (encoding.y && encoding.y.type === 'quantitative') {
                encoding.y.aggregate = op;
                if (encoding.y.title) {
                    encoding.y.title = `${op}[${encoding.y.title}]`
                }
            }
        }
    }
}

export function distVis(props: BaseVisProps) {
    const { pattern } = props;
    const { fields } = pattern;
    const usedChannels: Set<string> = new Set();
    let markType = autoMark(fields)
    markFixEncoding(markType, usedChannels)
    // if (filters && filters.length > 0) {
    //     usedChannels.add('color')
    // }
    const enc = encode(fields, usedChannels)
    // if (filters && filters.length > 0) {
    //     const field = filters[0].field;
    //     enc.color = {
    //         // field: field.fid,
    //         // type: field.semanticType,
    //         condition: {
    //             test: `datum['${field.fid}'] == '${filters[0].values[0]}'`
    //         },
    //         value: '#aaa'
    //         // value: '#000'
    //     }
    // }
    autoAgg(enc, fields, markType)
    humanHabbit(enc);

    let basicSpec: any = {
        // "config": {
        //     "range": {
        //       "category": {
        //         "scheme": "set2"
        //       }
        //     }
        //   },
        data: { name: 'dataSource' },
        mark: {
            type: markType,
            opacity: markType === 'circle' ? 0.56 : 0.88
        },
        encoding: enc
    };
    // if (filters && filters.length > 1) {
    //     basicSpec.transform = filters.slice(1).map(f => ({
    //         filter: `datum.${f.field.fid} == '${f.values[0]}'`
    //     }))
    // }
    // if (filters && filters.length > 0) {
    //     basicSpec.transform = filters.map(f => ({
    //         filter: `datum.${f.field.fid} == '${f.values[0]}'`
    //     }))
    // }
    return basicSpec;
}
