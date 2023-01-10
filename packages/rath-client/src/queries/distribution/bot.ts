import { IRow, ISemanticType, IFieldEncode } from '@kanaries/loa';
import { Statistics } from 'visual-insights';
import { IFieldMeta, IVegaSubset } from '../../interfaces';
import { isSetEqual } from '../../utils';

const { groupBy } = Statistics;

export function autoMark(
    fields: IFieldMeta[],
    transedFields: IFieldMeta[] = [],
    pureFields: IFieldMeta[] = [],
    statEncodes: IFieldEncode[] = [],
    dataSource?: IRow[]
) {
    // const orderFields = [...fields];
    // const orderStatFields = [...statFields];
    // orderFields.sort((a, b) => b.features.entropy - a.features.entropy);
    // orderStatFields.sort((a, b) => b.features.entropy - a.features.entropy);
    const allFields = [...transedFields, ...pureFields].sort((a, b) => b.features.entropy - a.features.entropy);
    const semanticFields = allFields.slice(0, 2);
    const semantics = semanticFields.map((f) => f.semanticType);
    // if (fields.length === 1) {
    //     return 'bar'
    // }
    // FIXME: 时间序列多目标
    // if (transedFields.length > 0) {
    //     // 仅对count生效。
    //     return 'bar'
    // }
    if (transedFields.length + pureFields.length <= 1) {
        return 'tick'
    }
    if (statEncodes.find((f) => f.aggregate === 'count')) {
        return 'bar';
    }
    // if (fields.length === 1) {
    //     return 'bar'
    // }
    const cond_sinleTargets = fields.filter((f) => f.analyticType === 'measure').length === 1;

    if (cond_sinleTargets) {
        if (isSetEqual(semantics, ['nominal', 'nominal'])) {
            return 'text';
        } else if (isSetEqual(semantics, ['nominal', 'quantitative'])) {
            const quanField = semanticFields.find((s) => s.semanticType === 'quantitative')!;
            const onlyNominalDimension =
                fields.filter((f) => f.analyticType === 'dimension').filter((f) => f.semanticType !== 'nominal')
                    .length === 0;
            if (onlyNominalDimension) {
                if (quanField.features.unique > 400) return 'boxplot';
                // if (quanField.features.unique > 16) return 'tick';
            }
            return 'bar';
        } else if (isSetEqual(semantics, ['ordinal', 'quantitative'])) {
            if (dataSource) {
                const dims = allFields.filter((f) => f.analyticType === 'dimension');
                const dsize = dims.reduce((c, t) => c * t.features.unique, 1);
                const groups = groupBy(
                    dataSource,
                    allFields.filter((f) => f.analyticType === 'dimension').map((f) => f.fid)
                );
                if (groups.size < dsize) {
                    return 'bar';
                }
                return 'line';
            }

            return 'line';
        } else if (isSetEqual(semantics, ['nominal', 'ordinal'])) {
            return 'point';
        } else if (isSetEqual(semantics, ['nominal', 'temporal'])) {
            return 'point';
        } else if (isSetEqual(semantics, ['quantitative', 'quantitative'])) {
            return 'area';
        } else if (isSetEqual(semantics, ['temporal', 'quantitative'])) {
            return 'line';
        }
    } else {
        if (isSetEqual(semantics, ['nominal', 'nominal'])) {
            return 'square';
        } else if (isSetEqual(semantics, ['nominal', 'quantitative'])) {
            if (dataSource) {
                const groups = groupBy(
                    dataSource,
                    allFields.filter((f) => f.analyticType === 'dimension').map((f) => f.fid)
                );
                if (groups.size > 16) {
                    return 'circle'
                }
            }
            return 'tick';
        } else if (isSetEqual(semantics, ['ordinal', 'quantitative'])) {
            return 'point';
        } else if (isSetEqual(semantics, ['nominal', 'ordinal'])) {
            return 'tick';
        } else if (isSetEqual(semantics, ['quantitative', 'quantitative'])) {
            return 'circle';
        } else if (isSetEqual(semantics, ['nominal', 'temporal'])) {
            return 'point';
        }
    }
    return 'point';
}

// FIXME: 统一aggregate逻辑。
export function autoStat(
    fields: IFieldMeta[],
    specifiedEncodes: IFieldEncode[]
): {
    statEncodes: IFieldEncode[];
} {
    if (specifiedEncodes.length > 0) {
        return { statEncodes: [...specifiedEncodes] }
    }
    const statEncodes: IFieldEncode[] = [];
    const cond_singlefield = fields.length === 1;
    const cond_nonquanmeasure =
        fields
            .filter((f) => f.analyticType === 'measure')
            .filter((f) => f.semanticType === 'nominal' || f.semanticType === 'ordinal').length > 0;
    const existedEnhanceCount = specifiedEncodes.find((e) => e.aggregate === 'count');
    if (existedEnhanceCount) {
        statEncodes.push(existedEnhanceCount);
        return { statEncodes };
    }
    if (cond_singlefield || cond_nonquanmeasure) {
        const existedEncode = specifiedEncodes.find((e) => e.aggregate === 'count');
        if (!existedEncode) {
            statEncodes.push({
                aggregate: 'count',
            });
        }
    } else {
        const targets = fields.filter((f) => f.analyticType === 'measure');
        // 单目标的场景
        if (targets.length === 1) {
            // 连续型 度量做聚合，非连续型度量做分箱；
            targets.forEach((f) => {
                const existedEncode = specifiedEncodes.find((e) => e.field === f.fid);
                if (existedEncode) {
                    return
                } else {
                    statEncodes.push({
                        field: f.fid,
                        type: f.semanticType,
                        title: `mean(${f.name || f.fid})`,
                        aggregate: 'mean',
                    });
                }
            });
            fields
                .filter((f) => f.analyticType === 'dimension' && f.semanticType === 'quantitative')
                .forEach((f) => {
                    const existedEncode = specifiedEncodes.find((e) => e.field === f.fid);
                    if (existedEncode) {
                        return
                    } else {
                        statEncodes.push({
                            field: f.fid,
                            title: f.name || f.fid,
                            type: f.semanticType,
                            bin: true,
                        });
                    }
                });
        }
    }
    statEncodes.push(...specifiedEncodes)
    return { statEncodes };
}

export type IChannel = 'y' | 'x' | 'size' | 'color' | 'opacity' | 'row' | 'column' | 'shape';
export const channels: { [key in ISemanticType]: IChannel[] } = {
    quantitative: ['y', 'x', 'size', 'color', 'opacity'],
    ordinal: ['y', 'x', 'color', 'opacity', 'size', 'shape'],
    nominal: ['y', 'x', 'color', 'row', 'column', 'size', 'shape', 'opacity'],
    temporal: ['y', 'x', 'size', 'color', 'opacity', 'shape'],
};

export const highOrderChannels = {
    dimension: ['row', 'column'],
    measure: ['repeat'],
} as const;

interface EncodeProps {
    fields: IFieldMeta[];
    channelEncoder: VizEncoder;
    statFields?: IFieldMeta[];
    statEncodes?: IFieldEncode[];
}
export function encode(props: EncodeProps) {
    const { fields, channelEncoder = new VizEncoder(), statFields = [], statEncodes = [] } = props;
    const orderFields = [...fields];
    let encoding: any = {};
    let inHighOrderStatus: keyof typeof highOrderChannels | null = null;
    let highOrderIndex: number = 0;
    orderFields.sort((a, b) => b.features.entropy - a.features.entropy);
    statFields.sort((a, b) => b.features.entropy - a.features.entropy);
    const totalFields = [...statFields, ...orderFields].sort((a, b) => b.features.entropy - a.features.entropy);
    // orderFields.unshift(...statFields);
    for (let i = 0; i < totalFields.length; i++) {
        const chs = channels[totalFields[i].semanticType];
        let encoded: boolean = false;
        const statIndex = statFields.findIndex((f) => f.fid === totalFields[i].fid);
        const orderIndex = orderFields.findIndex((f) => f.fid === totalFields[i].fid);
        const isStatField = statIndex > -1;
        if (isStatField) {
            for (let j = 0; j < chs.length; j++) {
                if (channelEncoder.avaiable(chs[j])) {
                    encoding[chs[j]] = statEncodes[statIndex];
                    channelEncoder.encode(chs[j], null);
                    encoded = true;
                    break;
                }
            }
            // 发生可能很低
            // FIXME 多度量repeat设计
            if (!encoded) {
                inHighOrderStatus = statFields[statIndex].analyticType;
                if (inHighOrderStatus === 'dimension' && highOrderIndex < highOrderChannels[inHighOrderStatus].length) {
                    encoding[highOrderChannels[inHighOrderStatus][highOrderIndex]] = statEncodes[statIndex];
                    highOrderIndex++;
                }
            }
        } else {
            for (let j = 0; j < chs.length; j++) {
                if (channelEncoder.avaiable(chs[j])) {
                    encoding[chs[j]] = {
                        field: orderFields[orderIndex].fid,
                        type: orderFields[orderIndex].semanticType,
                        title: orderFields[orderIndex].name || orderFields[orderIndex].fid,
                    };
                    if (orderFields[orderIndex].semanticType === 'temporal' && chs[j] === 'color') {
                        encoding[chs[j]].scale = {
                            scheme: 'viridis',
                        };
                    }
                    channelEncoder.encode(chs[j], orderFields[orderIndex]);
                    encoded = true;
                    break;
                }
            }
            if (!encoded) {
                inHighOrderStatus = orderFields[orderIndex].analyticType;
                if (inHighOrderStatus === 'dimension' && highOrderIndex < highOrderChannels[inHighOrderStatus].length) {
                    encoding[highOrderChannels[inHighOrderStatus][highOrderIndex]] = {
                        field: orderFields[orderIndex].fid,
                        type: orderFields[orderIndex].semanticType,
                    };
                    highOrderIndex++;
                }
            }
        }
    }
    return encoding;
}

export function humanHabbit(encoding: IVegaSubset['encoding']) {
    if (encoding.x && encoding.x.type !== 'ordinal') {
        if (encoding.y && encoding.y.type === 'ordinal') {
            const t = encoding.x;
            encoding.x = encoding.y;
            encoding.y = t;
        }
    }
    if (encoding.x && encoding.x.type !== 'temporal') {
        if (encoding.y && encoding.y.type === 'temporal') {
            const t = encoding.x;
            encoding.x = encoding.y;
            encoding.y = t;
        }
    }
}

function markFixEncoding(markType: string, usedChannels: Map<string, string | null>) {
    if (markType === 'bar') {
        usedChannels.set('size', null);
        usedChannels.set('shape', null);
    }
    if (markType === 'tick') {
        usedChannels.set('size', null);
    }
}

// function defineChannelSeparability (channels: IChannel[]): number[][] {
//     const mat = new Array(channels.length).fill(1).map(() => new Array(channels.length).fill(1))
//     const channelIndices: Map<IChannel, number> = new Map(channels.map((c, i) => [c, i]));
//     const nonSeparate = (c1: IChannel, c2: IChannel) => {
//         if (channelIndices.has(c1) && channelIndices.has(c2)) {
//             mat[channelIndices.get(c1)!][channelIndices.get(c2)!] = mat[channelIndices.get(c1)!][channelIndices.get(c2)!]
//         }
//     }
//     nonSeparate('color', 'shape');
//     return mat
// }

export class VizEncoder {
    public useChannels: Map<IChannel, string | null>;
    public markType: string | null = null;
    constructor(markType?: string) {
        this.useChannels = new Map();
        if (markType) {
            this.markType = markType || null;
            markFixEncoding(markType, this.useChannels);
        }
    }
    /**
     *
     * @param channel
     * @param fieldId
     * @returns success or not
     */
    public encode(channel: IChannel, field?: IFieldMeta | null): boolean {
        if (this.useChannels.has(channel)) return false;
        if (channel === 'color' && field?.semanticType !== 'nominal') {
            this.useChannels.set('opacity', null);
        }
        if (channel === 'opacity' && field?.semanticType !== 'nominal') {
            this.useChannels.set('opacity', null);
        }
        this.useChannels.set(channel, field ? field.fid : null);
        return true;
    }
    public avaiable(channel: IChannel) {
        return !this.useChannels.has(channel);
    }
}
