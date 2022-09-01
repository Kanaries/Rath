/**
 * distVis 是分布式可视化的推荐，是比较新的模块，目前暂时用于dev模块，即voyager模式下的测试。
 */
import { Statistics } from 'visual-insights'
import { IPattern } from '@kanaries/loa';
import { bin, binMap, mic, pureGeneralMic, rangeNormilize } from '@kanaries/loa';
import { IFieldMeta, IResizeMode, IRow, IVegaSubset } from "../interfaces";
import { deepcopy } from "../utils";
import { encodingDecorate } from "./base/utils";
import { applyDefaultSort, applyInteractiveParams2DistViz, applySizeConfig2DistViz } from "./distribution/utils";
import { autoMark, autoStat, encode, humanHabbit, VizEncoder } from './distribution/bot';
export const geomTypeMap: { [key: string]: any } = {
    interval: "boxplot",
    line: "line",
    point: "point",
    // density: 'rect'
    density: "point"
};

interface BaseVisProps {
    dataSource: IRow[];
    pattern: IPattern;
    interactive?: boolean;
    resizeMode?: IResizeMode;
    width?: number;
    height?: number;
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

export function labDistVis(props: BaseVisProps): IVegaSubset {
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

    let basicSpec: IVegaSubset = {
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
            type: markType as any,
            opacity: markType === 'circle' ? 0.66 : 0.88
        },
        encoding: enc
    };
    autoCoord(fields, basicSpec, dataSource)
    applyDefaultSort(basicSpec, fields)
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
