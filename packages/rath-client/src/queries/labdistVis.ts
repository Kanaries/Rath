/**
 * distVis 是分布式可视化的推荐，是比较新的模块，目前暂时用于dev模块，即voyager模式下的测试。
 */
import { Statistics } from 'visual-insights'
import { IPattern } from '@kanaries/loa';
import { bin, binMap, mic, pureGeneralMic, rangeNormilize } from '@kanaries/loa';
import { IFieldMeta, IResizeMode, IRow } from "../interfaces";
import { deepcopy } from "../utils";
import { encodingDecorate } from "./base/utils";
import { applyInteractiveParams2DistViz, applySizeConfig2DistViz } from "./distribution/utils";
export const geomTypeMap: { [key: string]: any } = {
    interval: "boxplot",
    line: "line",
    point: "point",
    // density: 'rect'
    density: "point"
};

const channels = {
    quantitative: ['y', 'x', 'size', 'color', 'opacity'],
    ordinal: ['y', 'x', 'opacity', 'color', 'size', 'shape'],
    nominal: ['y', 'x', 'color', 'row', 'column', 'opacity', 'size', 'shape'],
    temporal: ['y', 'x', 'size', 'color', 'opacity', 'shape']
} as const;
// const channels = {
//     quantitative: ['y' , 'x', 'size', 'color', 'opacity'],
//     ordinal: ['y', 'x', 'color', 'size', 'shape'],
//     nominal: ['y', 'x', 'color', 'row', 'column', 'size', 'shape'],
//     temporal: ['y', 'x', 'color', 'shape']
// } as const;

const highOrderChannels = {
    dimension: ['row', 'column'],
    measure: ['repeat']
} as const;

interface BaseVisProps {
    dataSource: IRow[];
    pattern: IPattern;
    interactive?: boolean;
    resizeMode?: IResizeMode;
    width?: number;
    height?: number;
}
function humanHabbit(encoding: any) {
    if (encoding.x && encoding.x.type !== 'temporal') {
        if (encoding.y && encoding.y.type === 'temporal') {
            const t = encoding.x;
            encoding.x = encoding.y;
            encoding.y = t;
        }
    }
}

interface EncodeProps {
    fields: IFieldMeta[];
    usedChannels?: Set<string>;
    statFields?: IFieldMeta[];
    statEncodes?: IFieldEncode[]
}
function encode(props: EncodeProps) {
    const {
        fields,
        usedChannels = new Set(),
        statFields = [],
        statEncodes = []
    } = props;
    const orderFields = [...fields];
    let encoding: any = {}
    let inHighOrderStatus: keyof typeof highOrderChannels | null = null;
    let highOrderIndex: number = 0;
    orderFields.sort((a, b) => b.features.entropy - a.features.entropy);
    statFields.sort((a, b) => b.features.entropy - a.features.entropy);
    const totalFields = [...statFields, ...orderFields].sort((a, b) => b.features.entropy - a.features.entropy);
    // const totalFields = [...statFields, ...orderFields].sort((a, b) => a.features.entropy - b.features.entropy);

    // orderFields.unshift(...statFields);
    for (let i = 0; i < totalFields.length; i++) {
        const chs = channels[totalFields[i].semanticType];
        let encoded: boolean = false;
        const statIndex = statFields.findIndex(f => f.fid === totalFields[i].fid)
        const orderIndex = orderFields.findIndex(f => f.fid === totalFields[i].fid)
        const isStatField = statIndex > -1;
        if (isStatField) {
            for (let j = 0; j < chs.length; j++) {
                if (!usedChannels.has(chs[j])) {
                    encoding[chs[j]] = statEncodes[statIndex]
                    usedChannels.add(chs[j])
                    encoded = true;
                    // if (statFields[statIndex].semanticType === 'quantitative') {
                    //     if (statFields[statIndex].features.entropy / Math.log2(16) > 0.8) {
                    //         encoding[chs[j]].scale = { type: 'sqrt' }
                    //     }
                    // }
                    break;
                }
            }
            // 发生可能很低
            // FIXME 多度量repeat设计
            if (!encoded) {
                inHighOrderStatus = statFields[statIndex].analyticType;
                if (inHighOrderStatus === 'dimension' && highOrderIndex < highOrderChannels[inHighOrderStatus].length) {
                    encoding[highOrderChannels[inHighOrderStatus][highOrderIndex]] = statEncodes[statIndex]
                    highOrderIndex++
                }
            }
        } else {
            for (let j = 0; j < chs.length; j++) {
                if (!usedChannels.has(chs[j])) {
                    encoding[chs[j]] = {
                        field: orderFields[orderIndex].fid,
                        type: orderFields[orderIndex].semanticType,
                        title: orderFields[orderIndex].name || orderFields[orderIndex].fid
                    }
                    if (orderFields[orderIndex].semanticType === 'temporal' && chs[j] === 'color') {
                        encoding[chs[j]].scale = {
                            scheme: 'viridis'
                        }
                    }
                    // if (orderFields[orderIndex].semanticType === 'quantitative') {
                    //     if (orderFields[orderIndex].features.entropy / Math.log2(16) > 0.8) {
                    //         encoding[chs[j]].scale = { type: 'sqrt' }
                    //     }
                    // }
                    usedChannels.add(chs[j])
                    encoded = true;
                    break;
                }
            }
            if (!encoded) {
                inHighOrderStatus = orderFields[orderIndex].analyticType;
                if (inHighOrderStatus === 'dimension' && highOrderIndex < highOrderChannels[inHighOrderStatus].length) {
                    encoding[highOrderChannels[inHighOrderStatus][highOrderIndex]] = {
                        field: orderFields[orderIndex].fid,
                        type: orderFields[orderIndex].semanticType
                    }
                    highOrderIndex++
                }
            }
        }
    }

    // for (let i = 0; i < statFields.length; i++) {
    //     const chs = channels[statFields[i].semanticType];
    //     let encoded: boolean = false;
    //     for (let j = 0; j < chs.length; j++) {
    //         if (!usedChannels.has(chs[j])) {
    //             encoding[chs[j]] = statEncodes[i]
    //             usedChannels.add(chs[j])
    //             encoded = true;
    //             break;
    //         }
    //     }
    //     // 发生可能很低
    //     if (!encoded) {
    //         inHighOrderStatus = statFields[i].analyticType;
    //         if (inHighOrderStatus === 'dimension' && highOrderIndex < highOrderChannels[inHighOrderStatus].length) {
    //             encoding[highOrderChannels[inHighOrderStatus][highOrderIndex]] = statEncodes[i]
    //             highOrderIndex++
    //         }
    //     }
    // }
    // for (let i = 0; i < orderFields.length; i++) {
    //     const chs = channels[orderFields[i].semanticType];
    //     let encoded: boolean = false;
    //     for (let j = 0; j < chs.length; j++) {
    //         if (!usedChannels.has(chs[j])) {
    //             encoding[chs[j]] = {
    //                 field: orderFields[i].fid,
    //                 type: orderFields[i].semanticType,
    //                 title: orderFields[i].name || orderFields[i].fid
    //             }
    //             usedChannels.add(chs[j])
    //             encoded = true;
    //             break;
    //         }
    //     }
    //     if (!encoded) {
    //         inHighOrderStatus = orderFields[i].analyticType;
    //         if (inHighOrderStatus === 'dimension' && highOrderIndex < highOrderChannels[inHighOrderStatus].length) {
    //             encoding[highOrderChannels[inHighOrderStatus][highOrderIndex]] = {
    //                 field: orderFields[i].fid,
    //                 type: orderFields[i].semanticType
    //             }
    //             highOrderIndex++
    //         }
    //     }
    // }
    return encoding
}

function isSetEqual(a1: any[], a2: any[]) {
    const s1 = new Set(a1);
    const s2 = new Set(a2);
    if (s1.size !== s2.size) return false;
    for (let ele of s1) {
        if (!s2.has(ele)) return false;
    }
    return true;
}

/**
 * 临时方法，暂时需要在encoding去定之后再去调用
 * @param fields 
 */
function autoCoord(fields: IFieldMeta[], spec: {[key: string]: any}, dataSource: IRow[]) {
    const latField = fields.find(f => f.geoRole === 'latitude');
    const lonField = fields.find(f => f.geoRole === 'longitude');
    const hasGeo = Boolean(latField && lonField);
    if (hasGeo && spec.encoding) {
        const latChannelKey = Object.keys(spec.encoding).find((c: string) => spec.encoding[c].field === latField!.fid)
        const lonChannelKey = Object.keys(spec.encoding).find((c: string) => spec.encoding[c].field === lonField!.fid)
        if (!isSetEqual(['x', 'y'], [latChannelKey, lonChannelKey]))return;
        latChannelKey && (spec.encoding.latitude = spec.encoding[latChannelKey!]) && (spec.encoding[latChannelKey!] = undefined)
        lonChannelKey && (spec.encoding.longitude = spec.encoding[lonChannelKey!]) && (spec.encoding[lonChannelKey!] = undefined)
        // spec.params = [{
        //     name: "grid",
        //     select: "interval",
        //     bind: "scales"
        // }]
        spec.layer = [
            {
                "data": {
                // "url": "https://vega.github.io/vega-lite/data/world-110m.json",
                    url: "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/china/china-provinces.json",
                    "format": {"type": "topojson", "feature": "CHN_adm1"}
                },
                projection: {
                    type: 'naturalEarth1'
                },
                "mark": {"type": "geoshape", "fill": "lightgray", "stroke": "gray"}
            },
            {
                data: { ...spec.data },
                mark: spec.mark,
                projection: {
                    type: 'naturalEarth1'
                },
                encoding: {
                    ...spec.encoding
                }
            }
        ]
        spec.width = 660
        // delete spec.data
        delete spec.mark
        delete spec.encoding
    }
}

function autoMark(fields: IFieldMeta[], statFields: IFieldMeta[] = [], originFields: IFieldMeta[] = [], statEncodes: IFieldEncode[] = []) {
    // const orderFields = [...fields];
    // const orderStatFields = [...statFields];
    // orderFields.sort((a, b) => b.features.entropy - a.features.entropy);
    // orderStatFields.sort((a, b) => b.features.entropy - a.features.entropy);
    const semantics = [...statFields, ...originFields].sort((a, b) => b.features.entropy - a.features.entropy).slice(0, 2).map(f => f.semanticType)
    // if (fields.length === 1) {
    //     return 'bar'
    // }
    // FIXME: 时间序列多目标
    // if (statFields.length > 0) {
    //     // 仅对count生效。
    //     return 'bar'
    // }
    if (statEncodes.find(f => f.aggregate === 'count')) {
        return 'bar'
    }
    // if (fields.length === 1) {
    //     return 'bar'
    // }
    const cond_sinleTargets = fields.filter(f => f.analyticType === 'measure').length === 1;

    if (cond_sinleTargets) {
        if (isSetEqual(semantics, ['nominal', 'nominal'])) {
            return 'text'
        } else if (isSetEqual(semantics, ['nominal', 'quantitative'])) {
            return 'bar'
        } else if (isSetEqual(semantics, ['ordinal', 'quantitative'])) {
            return 'point'
        } else if (isSetEqual(semantics, ['nominal', 'ordinal'])) {
            return 'point'
        } else if (isSetEqual(semantics, ['nominal', 'temporal'])) {
            return 'point'
        } else if (isSetEqual(semantics, ['quantitative', 'quantitative'])) {
            return 'circle'
        } else if (isSetEqual(semantics, ['temporal', 'quantitative'])) {
            return 'line'
        }
    } else {
        if (isSetEqual(semantics, ['nominal', 'nominal'])) {
            return 'square'
        } else if (isSetEqual(semantics, ['nominal', 'quantitative'])) {
            return 'tick'
        } else if (isSetEqual(semantics, ['ordinal', 'quantitative'])) {
            return 'point'
        } else if (isSetEqual(semantics, ['nominal', 'ordinal'])) {
            return 'tick'
        } else if (isSetEqual(semantics, ['quantitative', 'quantitative'])) {
            return 'circle'
        } else if (isSetEqual(semantics, ['nominal', 'temporal'])) {
            return 'point'
        }
    }
    return 'point'
}

function markFixEncoding(markType: string, usedChannels: Set<string>) {
    if (markType === 'bar') {
        usedChannels.add('size');
        usedChannels.add('shape');
    }
}

interface IFieldEncode {
    field?: string;
    title?: string;
    type?: string;
    aggregate?: string;
    bin?: boolean;
}

// FIXME: 统一aggregate逻辑。
function autoStat(fields: IFieldMeta[]): {
    statFields: IFieldMeta[];
    distFields: IFieldMeta[];
    statEncodes: IFieldEncode[];
} {
    const statFields: IFieldMeta[] = [];
    const statEncodes: IFieldEncode[] = [];
    const cond_singlefield = fields.length === 1;
    const cond_nonquanmeasure = fields.filter(f => f.analyticType === 'measure').filter(f => f.semanticType === 'nominal' || f.semanticType === 'ordinal').length > 0;
    if (cond_singlefield || cond_nonquanmeasure) {
        statFields.push({
            fid: '__tmp_stat_id_unique',
            semanticType: 'quantitative',
            analyticType: 'measure',
            geoRole: 'none',
            features: {
                entropy: Infinity,
                maxEntropy: Infinity,
                unique: 1000
            },
            distribution: []
        })
        statEncodes.push({
            aggregate: 'count'
        })
        fields.filter(f => f.semanticType === 'quantitative').forEach(f => {
            statFields.push({ ...f })
            statEncodes.push({
                field: f.fid,
                title: f.name || f.fid,
                type: f.semanticType,
                bin: true
            })
        })
    } else {
        const targets = fields.filter(f => f.analyticType === 'measure');
        // 单目标的场景
        if (targets.length === 1) {
            // 连续型 度量做聚合，非连续型度量做分箱；
            targets.forEach(f => {
                statFields.push({ ...f })
                statEncodes.push({
                    field: f.fid,
                    type: f.semanticType,
                    title: `mean(${f.name || f.fid})`,
                    aggregate: 'mean'
                })
            })
            fields.filter(f => f.analyticType === 'dimension' && f.semanticType === 'quantitative').forEach(f => {
                statFields.push({ ...f })
                statEncodes.push({
                    field: f.fid,
                    title: f.name || f.fid,
                    type: f.semanticType,
                    bin: true
                })
            })
        }
    }
    const distFields = fields.filter(f => !statFields.find(sf => sf.fid === f.fid));
    return { statFields, distFields, statEncodes }
}

export function labDistVis(props: BaseVisProps) {
    const { pattern, dataSource, width, height, interactive, resizeMode = IResizeMode.auto } = props;
    const fields = deepcopy(pattern.fields) as IFieldMeta[];
    const measures = fields.filter(f => f.analyticType === 'measure');
    const dimensions = fields.filter(f => f.analyticType === 'dimension');
    // const TT = dataSource.map(r => dimensions.map(d => `${d.fid}_${r[d.fid]}`).join(','));
    // for (let i = 0; i < measures.length; i++) {
    //     const values = dataSource.map(r => r[measures[i].fid]);
    //     // const ent = pureGeneralConditionH(TT, values);
    //     measures[i].features.entropy = entropy(rangeNormilize(bin(values).filter(v => v > 0)))
    //     // measures[i].features.entropy = measures[i].features.entropy - ent;
    // }
    for (let i = 0; i < measures.length; i++) {
        let score = 0;
        const values1 = dataSource.map(r => r[measures[i].fid]);
        const T = binMap(values1);
        if (measures.length > 1) {
            for (let j = 0; j < measures.length; j++) {
                if (j === i) continue;
                const values2 = dataSource.map(r => r[measures[j].fid]);
                score += mic(T, values2);
                // const X: [number, number][] = values2.map((v, vi) => [v, values1[vi]]);
                // const ranges = initRanges(X, 2);
                // score += entropy(rangeNormilize(matrixBinShareRange(X, ranges).flatMap(v => v).filter(v => v > 0)));
            }
            score /= (measures.length - 1)
        } else {
            score = Math.log2(16) - Statistics.entropy(rangeNormilize(bin(values1).filter(v => v > 0)))
        }
        measures[i].features.entropy = score;
    }
    for (let i = 0; i < dimensions.length; i++) {
        const T = dataSource.map(r => r[dimensions[i].fid]);
        let totalEntLoss = 0;
        // if (measures.length === 1) {
        //     const values = dataSource.map(r => r[measures[0].fid]);
        //     const entLoss = generalMic(T, values) // pureGeneralMic(T, values);
        //     totalEntLoss += entLoss;
        // } else {
        //     const meaIds = measures.map(m => m.fid);
        //     const projections = getCombination(meaIds, 2, 2);
        //     for (let pro of projections) {
        //         const meaProValues: [number, number][] = dataSource.map(row => [row[pro[0]], row[pro[1]]])
        //         const score = generalMatMic(T, meaProValues);
        //         totalEntLoss += score;
        //     }
        //     totalEntLoss /= projections.length
        // }
        for (let j = 0; j < measures.length; j++) {
            const values = dataSource.map(r => r[measures[j].fid]);
            const entLoss = pureGeneralMic(T, values);
            totalEntLoss += entLoss;
        }
        totalEntLoss /= measures.length;
        //@ts-ignore
        dimensions[i].features.originEntropy = dimensions[i].features.entropy
        dimensions[i].features.entropy = totalEntLoss;
    }
    const usedChannels: Set<string> = new Set();
    const { statFields, distFields, statEncodes } = autoStat(fields);
    let markType = autoMark(fields, statFields, distFields, statEncodes)
    markFixEncoding(markType, usedChannels)
    // if (filters && filters.length > 0) {
    //     usedChannels.add('color')
    // }
    const enc = encode({
        fields: distFields, usedChannels, statFields,
        statEncodes
    })
    if (markType === 'bar' && statEncodes.length > 0) {
        if (enc && enc.x && enc.y) {
            if (enc.x.field && enc.y.field) {
                const sortEncodeField = (enc.y.type === 'quantitative' ? enc.x : enc.y);
                const sortBasedEncodeField = (enc.y.type === 'quantitative' ? enc.y : enc.x);
                sortEncodeField.sort = {
                    field: sortBasedEncodeField.field,
                    op: sortBasedEncodeField.aggregate || 'count',
                    order: 'descending'
                }
            }
        }
    }
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
    // autoAgg({
    //     encoding: enc, fields, markType,
    //     statFields
    // })
    humanHabbit(enc);
    // const shouldFixVisSize = encodingDecorate(enc, fields);
    if (resizeMode === IResizeMode.control) {
        encodingDecorate(enc, fields, statFields);
    }

    let basicSpec: any = {
        // "config": {
        //     "range": {
        //       "category": {
        //         "scheme": "set2"
        //       }
        //     }
        //   },
        data: { name: 'dataSource' },
        // "params": [{
        //     "name": "grid",
        //     "select": "interval",
        //     "bind": "scales"
        //   }],
        mark: {
            type: markType,
            opacity: markType === 'circle' ? 0.56 : 0.88
        },
        encoding: enc
    };
    autoCoord(fields, basicSpec, dataSource)
    applySizeConfig2DistViz(basicSpec, {
        mode: resizeMode,
        width,
        height
    })
    if (interactive) {
        applyInteractiveParams2DistViz(basicSpec);
    }
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
