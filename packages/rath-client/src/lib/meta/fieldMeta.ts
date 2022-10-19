import { bin, rangeNormilize } from '@kanaries/loa';
import { UnivariateSummary, Statistics } from 'visual-insights'
import { IFieldMeta, IRawField, IRow } from "../../interfaces";
import { getRange } from "../../utils";

const { getFieldDistribution } = UnivariateSummary

export function computeFieldMeta (dataSource: IRow[], rawFields: IRawField[]): IFieldMeta[] {

    const fieldMetas: IFieldMeta[] = [];
    for (let rawField of rawFields) {
        let _min = 0, _max = 0;
        const values = dataSource.map(r => r[rawField.fid])
        const dist = getFieldDistribution(dataSource, rawField.fid)
        let ent = 0, maxEnt = 4;
        if (rawField.semanticType === 'quantitative') {
            [_min, _max] = getRange(values);
            ent = Statistics.entropy(rangeNormilize(bin(values).filter(v => v > 0)))
            maxEnt = Math.log2(dist.length);
        }
        fieldMetas.push({
            fid: rawField.fid,
            name: rawField.name,
            semanticType: rawField.semanticType,
            analyticType: rawField.analyticType,
            geoRole: rawField.geoRole,
            features: {
                entropy: ent,
                maxEntropy: maxEnt,
                unique: dist.length,
                max: _max,
                min: _min
            },
            distribution: dist,
            disable: rawField.disable
        })
    }
    return fieldMetas;
}