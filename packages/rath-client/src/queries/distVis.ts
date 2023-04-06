/**
 * distVis 是分布式可视化的推荐，是比较新的模块，目前暂时用于dev模块，即voyager模式下的测试。
 */
import { IPattern, IFieldEncode } from '@kanaries/loa';
import { IResizeMode, IVegaSubset } from "../interfaces";
import { autoScale } from './base/scale';
import { applyZeroScale, encodingDecorate, splitFieldsByEnocdes } from "./base/utils";
import { autoMark, autoStat, encode, humanHabbit, VizEncoder } from './distribution/bot';
import { applyDefaultSort, applyInteractiveParams2DistViz, applySizeConfig2DistViz } from "./distribution/utils";

interface BaseVisProps {
    // dataSource: DataSource;
    pattern: IPattern;
    /** @default false */
    interactive?: boolean;
    resizeMode?: IResizeMode;
    width?: number;
    height?: number;
    stepSize?: number;
    excludeScaleZero?: boolean;
    specifiedEncodes?: IFieldEncode[]
}

export function distVis(props: BaseVisProps): IVegaSubset {
    const { pattern, resizeMode = IResizeMode.auto, width, height, interactive, stepSize, excludeScaleZero, specifiedEncodes = [] } = props;
    const { fields } = pattern;
    const { statEncodes } = autoStat(fields, specifiedEncodes);
    const { pureFields: distFields, transedFields: statFields } = splitFieldsByEnocdes(fields, statEncodes);

    const { scaleEncodes} = autoScale(distFields, statEncodes);

    const transedEncodes = statEncodes.concat(scaleEncodes);

    const { pureFields, transedFields } = splitFieldsByEnocdes(fields, transedEncodes);
    // const { statFields, distFields, statEncodes } = autoStat(fields);
    let markType = autoMark(fields, transedFields, pureFields, transedEncodes)
    const channelEncoder = new VizEncoder(markType);
    // if (filters && filters.length > 0) {
    //     usedChannels.add('color')
    // }
    const enc = encode({
        fields: pureFields,
        channelEncoder,
        statFields: transedFields,
        statEncodes: transedEncodes,
    })
    if (excludeScaleZero) {
        applyZeroScale(enc);
    }

    humanHabbit(enc);

    if (resizeMode === IResizeMode.control) {
        encodingDecorate(enc, fields, statFields);
    }

    let basicSpec: IVegaSubset = {

        data: { name: 'dataSource' },
        mark: {
            type: markType as any,
            opacity: markType === 'circle' ? 0.66 : 0.88,
            tooltip: true
        },
        encoding: enc
    };
    applyDefaultSort(basicSpec, fields);
    applySizeConfig2DistViz(basicSpec, {
        mode: resizeMode,
        width,
        height,
        stepSize
    })
    if (interactive) {
        applyInteractiveParams2DistViz(basicSpec);
    }
    return basicSpec;
}
