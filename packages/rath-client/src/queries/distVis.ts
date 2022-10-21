/**
 * distVis 是分布式可视化的推荐，是比较新的模块，目前暂时用于dev模块，即voyager模式下的测试。
 */
import { IPattern } from '@kanaries/loa';
import { IResizeMode, IVegaSubset } from "../interfaces";
import { applyZeroScale, encodingDecorate } from "./base/utils";
import { autoMark, autoStat, encode, humanHabbit, VizEncoder } from './distribution/bot';
import { applyDefaultSort, applyInteractiveParams2DistViz, applySizeConfig2DistViz } from "./distribution/utils";
export const geomTypeMap: { [key: string]: any } = {
    interval: "boxplot",
    line: "line",
    point: "point",
    // density: 'rect'
    density: "point"
};

interface BaseVisProps {
    // dataSource: DataSource;
    pattern: IPattern;
    interactive?: boolean;
    resizeMode?: IResizeMode;
    width?: number;
    height?: number;
    stepSize?: number;
    excludeScaleZero?: boolean;
}

export function distVis(props: BaseVisProps): IVegaSubset {
    const { pattern, resizeMode = IResizeMode.auto, width, height, interactive, stepSize, excludeScaleZero } = props;
    const { fields } = pattern;
    const { statFields, distFields, statEncodes } = autoStat(fields);
    let markType = autoMark(fields, statFields, distFields, statEncodes)
    const channelEncoder = new VizEncoder(markType);
    // if (filters && filters.length > 0) {
    //     usedChannels.add('color')
    // }
    const enc = encode({
        fields: distFields,
        channelEncoder,
        statFields,
        statEncodes
    })
    if (excludeScaleZero) {
        applyZeroScale(enc);
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

    if (resizeMode === IResizeMode.control) {
        encodingDecorate(enc, fields, statFields);
    }

    let basicSpec: IVegaSubset = {
        // "config": {
        //     "range": {
        //       "category": {
        //         "scheme": "set2"
        //       }
        //     }
        //   },
        data: { name: 'dataSource' },
        mark: {
            type: markType as any,
            opacity: markType === 'circle' ? 0.66 : 0.88
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
