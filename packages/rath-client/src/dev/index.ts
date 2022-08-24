import { IRow } from "visual-insights";
import { entropy, getCombination } from "visual-insights/build/esm/statistics";
import { IFieldMeta } from "../interfaces";
import { getRange } from "../utils";
import { bin, binMapShareRange, binShareRange, generalMatMic, generalMic, incSim, l1Dis2, mic, normalizeScatter, rangeNormilize } from "./utils";
import { parse, View } from 'vega';
import { compile } from 'vega-lite'
import { labDistVis } from "../queries/labdistVis";

export interface IFilter {
    field: IFieldMeta;
    values: any[];
}
export interface IPattern {
    fields: IFieldMeta[];
    imp: number;
    filters?: IFilter[]
    // rows: IRow[];
}

export function applyFilter (dataSource: IRow[], filters?: IFilter[]): IRow[] {
    if (!filters || filters.length === 0) return dataSource;
    return dataSource.filter(row => {
        return filters.every(f => f.values.includes(row[f.field.fid]))
    })
}
// FIXME: 洞察计算时，没有考虑把数据集做filter
// TODO: 要能清洗的看出来，filter前后的比对
// TODO: 每次要计算当前层级的信息增益。
export class NextVICore {
    public BIN_SIZE = 16;
    public dataSource: IRow[] = [];
    public fields: IFieldMeta[] = [];
    public patterns: IPattern[] = [];
    constructor (dataSource: IRow[], fields: IFieldMeta[]) {
        this.dataSource = dataSource;
        this.fields = fields;
    }
    public init(dataSource: IRow[], fields: IFieldMeta[]) {
        this.dataSource = dataSource;
        this.fields = fields;
        this.patterns = [];
    }
    public recommandFilter (view: IPattern) {
        const viewDimensions = view.fields.filter(f => f.analyticType === 'dimension');
        const viewMeasures = view.fields.filter(f => f.analyticType === 'measure');
        let viewDimNotInFilters: IFieldMeta[] = [...viewDimensions];
        if (typeof view.filters !== 'undefined') {
            viewDimNotInFilters = viewDimensions.filter(vd => !view.filters!.find(vf => vf.field.fid === vd.fid));
        }
        const ans: IPattern[] = [];
        if (viewDimNotInFilters.length > 0) {
            let ansDimKey = '';
            let dimvs: any[] = [];
            let bestScore = 0;
            for (let dim of viewDimNotInFilters) {
                const dimValues = this.dataSource.map(row => row[dim.fid]);
                let meanScore =  0;
                viewMeasures.forEach(mea => {
                    const meaValues =  this.dataSource.map(row => row[mea.fid]);
                    const score = generalMic(dimValues, meaValues);
                    meanScore += score;
                })
                meanScore /= viewMeasures.length;
                if (meanScore > bestScore) {
                    bestScore = meanScore;
                    ansDimKey = dim.fid;
                    dimvs = dimValues;
                }
            }
            if (ansDimKey!== '') {
                const dimUniques = new Set(dimvs);
                for (let v of dimUniques.values()) {
                    let ansFilters: IFilter[] = [];
                    const viewFieldsInFilter: IFieldMeta[] = []; // = view.fields.find(f => f.fid === ansDimKey)!;
                    const viewFieldsNotInFilter: IFieldMeta[] = [];
                    for (let field of view.fields) {
                        if (field.fid === ansDimKey) viewFieldsInFilter.push(field);
                        else {
                            viewFieldsNotInFilter.push(field)
                        }
                    }
                    if (viewFieldsInFilter.length === 0) continue;
                    if (view.filters) {
                        ansFilters.push(...view.filters)
                    }
                    // const groups = new Map();
                    let score = 0;
                    for (let mea of viewMeasures) {
                        // const meaRange = getRange(this.dataSource.map(row => row[mea.fid]))
                        const values = this.dataSource.map(row => row[mea.fid]);
                        const meaRange = getRange(values)
                        const globalDist = rangeNormilize(binShareRange(values, meaRange[0], meaRange[1]));
                        const subMeaValues: number[] = this.dataSource.filter(row => row[ansDimKey] === v).map(row => row[mea.fid]);
                        const subDist = rangeNormilize(binMapShareRange(subMeaValues, meaRange[0], meaRange[1]));
                        let kl = 0;
                        for (let i = 0; i < globalDist.length; i++) {
                            if (globalDist[i] > 0 && subDist[i] > 0) {
                                kl += globalDist[i] * Math.log2(globalDist[i] / subDist[i])
                            }
                        }
                        // score = Math.max(kl, score)
                        score += kl * (subMeaValues.length / values.length);
                    }
                    score /= viewMeasures.length;

                    ansFilters.push({
                        field: viewFieldsInFilter[0],
                        values: [v]
                    })
                    ans.push({
                        imp: score,
                        fields: viewFieldsNotInFilter,
                        filters: ansFilters
                    })
                }
            }
        }
        ans.sort((a, b) => b.imp - a.imp)
        return ans;
    }
    public searchPatterns () {
        const { dataSource } = this;
        const measures = this.fields.filter(f => f.analyticType === 'measure');
        for (let i = 0; i < measures.length; i++) {
            const values = dataSource.map(row => row[measures[i].fid]);
            // let _max = Math.max(...values);
            // let _min = Math.min(...values);
            // let step = (_max - _min) / this.BIN_SIZE;
            const bins = bin(values);
            const pl = rangeNormilize(bins.filter(f => f > 0))
            const ent = entropy(pl);
            this.patterns.push({
                fields: [measures[i]],
                imp: ent,
                // rows: bins.map((v, vi) => ({
                //     bin: _min + vi * step,
                //     count: v
                // }))
            })    
        }
        // const dimensions = this.fields.filter(f => f.analyticType === 'dimension');
        // for (let dim of dimensions) {
        //     this.patterns.push({
        //         fields: [dim],
        //         imp: dim.features.entropy
        //     })
        // }
        this.patterns.sort((a, b) => a.imp - b.imp);
        return this.patterns;
    }
    public createHighOrderPatterns (pattern: IPattern) {
        const fieldsInView = pattern.fields;
        const viewData = applyFilter(this.dataSource, pattern.filters);
        const measures = this.fields.filter(f => f.analyticType === 'measure');
        const patterns: IPattern[] = [];
        for (let i = 0; i < measures.length; i++) {
            if (!fieldsInView.find(f => f.fid === measures[i].fid)) {
                let score = 0;
                const T = viewData.map(r => r[measures[i].fid]);
                for (let j = 0; j < fieldsInView.length; j++) {
                    if (fieldsInView[j].analyticType === 'measure') {
                        const X = viewData.map(r => r[fieldsInView[j].fid]);
                        score += mic(T, X)
                    }
                }
                score /= fieldsInView.length;
                patterns.push({
                    fields: [...fieldsInView, measures[i]],
                    filters: pattern.filters,
                    imp: score
                })
            }
        }
        patterns.sort((a, b) => b.imp - a.imp)
        return patterns;
    }
    public firstPattern () {
        const measures = this.fields.filter(f => f.analyticType === 'measure');
        const matrix: number[][] = new Array(measures.length).fill(0).map(() => new Array(measures.length).fill(0));
        for (let i = 0; i < measures.length; i++) {
            for (let j = 0 ; j < measures.length; j++) {
                const TValues = this.dataSource.map(row => row[measures[i].fid]);
                const [T_min, T_max] = getRange(TValues)
                const T = binMapShareRange(TValues, T_min, T_max);
                const X = this.dataSource.map(row => row[measures[j].fid]);
                matrix[i][j] = mic(T, X);
            }
        }
        return matrix;
    }

    /**
     * 这里其实是比较机制，不是二阶的pattern
     * @returns 
     */
    public secondPattern () {
        const { dataSource } = this;
        const measures = this.fields.filter(f => f.analyticType === 'measure');
        const patterns: [IFieldMeta, IFieldMeta][] = [];
        for (let i = 0; i < measures.length; i++) {
            for (let j = i + 1; j < measures.length; j++) {
                patterns.push([measures[i], measures[j]])
            }
        }
        const patternNum = patterns.length;
        const normizedScatters = patterns.map(patt => {
            return normalizeScatter(dataSource.map(row => [row[patt[0].fid], row[patt[1].fid]]))
        })

        const matrix: number[][] = new Array(patternNum).fill(0).map(() => new Array(patternNum).fill(0));
        for (let i = 0; i < patternNum; i++) {
            for (let j = i + 1; j < patternNum; j++) {
                matrix[i][j] = matrix[j][i] = l1Dis2(normizedScatters[i], normizedScatters[j])
            }
        }
        return matrix
    }

    public fewatureSelectionForSecondPatternWithSpecifiedViews (patt1: [IFieldMeta, IFieldMeta], patt2: [IFieldMeta, IFieldMeta]): {
        features: IFieldMeta[];
        score: number;
    } | null {
        const { dataSource } = this;
        const dimensions = this.fields.filter(f => f.analyticType === 'dimension');
        // const measures = this.fields.filter(f => f.analyticType === 'measure');
        let patt1Points = dataSource.map(row => [row[patt1[0].fid], row[patt1[1].fid]]) as [number, number][];
        let patt2Points = dataSource.map(row => [row[patt2[0].fid], row[patt2[1].fid]]) as [number, number][];
        let bestDScore = 0;
        let bestDIndex = -1;
        for (let k = 0; k < dimensions.length; k++) {
            const t = dataSource.map(row => row[dimensions[k].fid])
            const dimScore = incSim(t, patt1Points, patt2Points)
            if (dimScore > bestDScore) {
                bestDScore = dimScore;
                bestDIndex = k;
            }
        }
        if (bestDIndex > -1) {
            // console.log(
            //     patt1.map(f => f.fid), 
            //     patt2.map(f => f.fid), 
            //     dimensions[bestDIndex].fid, 
            //     bestDScore);
            return {
                features: [dimensions[bestDIndex]],
                score: bestDScore
            }
        } else {
            return null;
        }
    }

    public pureFeatureRecommand (pattern: IPattern): IPattern[] {
        const { dataSource } = this;
        const viewData = applyFilter(dataSource, pattern.filters);
        const dimensions = this.fields.filter(f => f.analyticType === 'dimension');
        // const measures = this.fields.filter(f => f.analyticType === 'measure');
        const viewMeasures = pattern.fields.filter(f => f.analyticType === 'measure');
        const viewDimensions = pattern.fields.filter(f => f.analyticType === 'dimension');
        // const nonViewMeasures = measures.filter(f => viewMeasures.findIndex(vf => vf.fid === f.fid) === -1);
        const nonViewDimensions = dimensions.filter(f => viewDimensions.findIndex(vf => vf.fid === f.fid) === -1);
        const ans: IPattern[] = [];
        // fixme: 多个维度时，要渐进的算增益
        nonViewDimensions.forEach(dim => {
            const dimValues = viewData.map(row => row[dim.fid]);
            let meanScore =  0;
            if (viewMeasures.length === 1) {
                const mea = viewMeasures[0];
                const meaValues =  viewData.map(row => row[mea.fid]);
                const score = generalMic(dimValues, meaValues);
                meanScore += score;
            } else if (viewMeasures.length > 1) {
                const meaIds = viewMeasures.map(m => m.fid);
                const projections = getCombination(meaIds, 2, 2);
                for (let pro of projections) {
                    const meaProValues: [number, number][] = viewData.map(row => [row[pro[0]], row[pro[1]]])
                    const score = generalMatMic(dimValues, meaProValues);
                    meanScore += score;
                }
                meanScore /= projections.length
            }
            ans.push({
                imp: meanScore,
                fields: [...pattern.fields, dim],
                filters: pattern.filters
            })
        })
        // nonViewMeasures.forEach(meaFeat => {
        //     const dimValues = dataSource.map(row => row[meaFeat.fid]);
        //     let meanScore =  0;
        //     viewMeasures.forEach(mea => {
        //         const meaValues =  dataSource.map(row => row[mea.fid]);
        //         const score = mic(dimValues, meaValues);
        //         meanScore += score;
        //     })
        //     meanScore /= viewMeasures.length;
        //     ans.push([[...fields, meaFeat], meanScore])
        // })
        ans.sort((a, b) => b.imp - a.imp)
        return ans;
    }

    public featureSelectForSecondPattern () {
        const { dataSource } = this;
        const dimensions = this.fields.filter(f => f.analyticType === 'dimension');
        const measures = this.fields.filter(f => f.analyticType === 'measure');
        const patterns: [IFieldMeta, IFieldMeta][] = [];
        for (let i = 0; i < measures.length; i++) {
            for (let j = i + 1; j < measures.length; j++) {
                patterns.push([measures[i], measures[j]])
            }
        }
        const patternNum = patterns.length;
        for (let i = 0; i < patternNum; i++) {
            for (let j = i + 1; j < patternNum; j++) {
                let pattX = dataSource.map(row => [row[patterns[i][0].fid], row[patterns[i][1].fid]]) as [number, number][];
                let pattY = dataSource.map(row => [row[patterns[j][0].fid], row[patterns[j][1].fid]]) as [number, number][];
                let bestDScore = 0;
                let bestDIndex = -1;
                for (let k = 0; k < dimensions.length; k++) {
                    const t = dataSource.map(row => row[dimensions[k].fid])
                    const dimScore = incSim(t, pattX, pattY)
                    if (dimScore > bestDScore) {
                        bestDScore = dimScore;
                        bestDIndex = k;
                    }
                }
                if (bestDIndex > -1) {
                    console.log(
                        patterns[i].map(f => f.fid), 
                        patterns[j].map(f => f.fid), 
                        dimensions[bestDIndex].fid, 
                        bestDScore);
                }
            }
        }
    }

    public async renderViews2Images (patterns: IPattern[], dataSource: IRow[]) {
        const images: string[] = [];
        for (let i = 0; i < patterns.length; i++) {
            const filterdData = applyFilter(dataSource, patterns[i].filters);
            // @ts-ignore
            const offscreen: HTMLCanvasElement = new OffscreenCanvas(256, 256);
            const vegaLiteSpec = labDistVis({
                dataSource: filterdData,
                pattern: patterns[i]
            })
            vegaLiteSpec.data = { values: filterdData };
            const vegaSpec = compile(vegaLiteSpec);
            const view = new View(parse(vegaSpec.spec), {
                renderer: 'none'
            })
            // view.run();
            await view.toCanvas(2, {
                externalContext: offscreen.getContext('2d')
            })
            const str = offscreen.toDataURL(); // view.toImageURL('png', 2);
            images.push(str)
        }
        return images;
    }
}