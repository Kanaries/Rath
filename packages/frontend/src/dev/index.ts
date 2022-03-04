import { IViewField } from "@kanaries/graphic-walker/dist/interfaces";
import { IRow } from "visual-insights";
import { entropy } from "visual-insights/build/esm/statistics";
import { IFieldMeta } from "../interfaces";
import { bin, binMap, binMapShareRange, generalMic, incSim, l1Dis2, mic, normalizeScatter, rangeNormilize } from "./utils";

export interface IPattern {
    measures: IFieldMeta[];
    imp: number;
    // rows: IRow[];
}

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
                measures: [measures[i]],
                imp: ent,
                // rows: bins.map((v, vi) => ({
                //     bin: _min + vi * step,
                //     count: v
                // }))
            })    
        }
        this.patterns.sort((a, b) => a.imp - b.imp);
        return this.patterns;
    }
    public createHighOrderPatterns (fieldsInView: IFieldMeta[]) {
        const measures = this.fields.filter(f => f.analyticType === 'measure');
        const patterns: IPattern[] = [];
        for (let i = 0; i < measures.length; i++) {
            if (!fieldsInView.find(f => f.fid === measures[i].fid)) {
                patterns.push({
                    measures: [...fieldsInView, measures[i]],
                    imp: 0
                })
            }
        }
        return patterns;
    }
    public firstPattern () {
        const measures = this.fields.filter(f => f.analyticType === 'measure');
        // console.log(measures.map(f => f.fid))
        const matrix: number[][] = new Array(measures.length).fill(0).map(() => new Array(measures.length).fill(0));
        for (let i = 0; i < measures.length; i++) {
            for (let j = 0 ; j < measures.length; j++) {
                const TValues = this.dataSource.map(row => row[measures[i].fid]);
                const T_min = Math.min(...TValues)
                const T_max = Math.max(...TValues)
                const T = binMapShareRange(TValues, T_min, T_max);
                const X = this.dataSource.map(row => row[measures[j].fid]);
                matrix[i][j] = mic(T, X);
            }
        }
        return matrix;
    }

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
                // console.log(matrix[i][j], patterns[i], patterns[j])
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
            console.log(
                patt1.map(f => f.fid), 
                patt2.map(f => f.fid), 
                dimensions[bestDIndex].fid, 
                bestDScore);
            return {
                features: [dimensions[bestDIndex]],
                score: bestDScore
            }
        } else {
            return null;
        }
    }

    public pureFeatureRecommand (fields: IFieldMeta[]): [IFieldMeta[], number][] {
        const { dataSource } = this;
        const dimensions = this.fields.filter(f => f.analyticType === 'dimension');
        const measures = this.fields.filter(f => f.analyticType === 'measure');
        const viewMeasures = fields.filter(f => f.analyticType === 'measure');
        const viewDimensions = fields.filter(f => f.analyticType === 'dimension');
        const nonViewMeasures = measures.filter(f => viewMeasures.findIndex(vf => vf.fid === f.fid) === -1);
        const nonViewDimensions = dimensions.filter(f => viewDimensions.findIndex(vf => vf.fid === f.fid) === -1);
        const ans: [IFieldMeta[], number][] = [];
        // fixme: 多个维度时，要渐进的算增益
        nonViewDimensions.forEach(dim => {
            const dimValues = dataSource.map(row => row[dim.fid]);
            let meanScore =  0;
            viewMeasures.forEach(mea => {
                const meaValues =  dataSource.map(row => row[mea.fid]);
                const score = generalMic(dimValues, meaValues);
                meanScore += score;
            })
            meanScore /= viewMeasures.length;
            ans.push([[...fields, dim], meanScore])
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
        ans.sort((a, b) => b[1] - a[1])
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
}