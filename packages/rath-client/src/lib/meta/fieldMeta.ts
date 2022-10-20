import { bin, ISemanticType, rangeNormilize } from '@kanaries/loa';
import { Statistics } from 'visual-insights';
import { IFieldMeta, IRawField, IRow } from '../../interfaces';
import { getRange } from '../../utils';

export function computeFieldFeatures(values: any[], semanticType: ISemanticType): { features: IFieldMeta['features']; distribution: IFieldMeta['distribution'] } {
    const valueMap: Map<any, number> = new Map();
    for (const value of values) {
        valueMap.set(value, (valueMap.get(value) || 0) + 1);
    }
    const dist: IFieldMeta['distribution'] = Array.from(valueMap.entries()).map((r) => ({
        memberName: r[0],
        count: r[1],
    }));

    const [_min, _max] = getRange(values);
    let ent = 0,
        maxEnt = 4;
    const sum = values.reduce((t, v) => t + v, 0);
    if (semanticType === 'quantitative') {
        ent = Statistics.entropy(rangeNormilize(bin(values).filter((v) => v > 0)));
        maxEnt = Math.log2(dist.length);
    }
    return {
        features: {
            entropy: ent,
            maxEntropy: maxEnt,
            unique: dist.length,
            max: _max,
            min: _min,
            sum: sum,
            mean: sum / values.length,
            count: values.length,
        },
        distribution: dist
    };
}

export function computeFieldMeta(dataSource: IRow[], rawFields: IRawField[]): IFieldMeta[] {
    const fieldMetas: IFieldMeta[] = [];
    for (let rawField of rawFields) {
        const values = dataSource.map((r) => r[rawField.fid]);
        const { features, distribution } = computeFieldFeatures(values, rawField.semanticType);
        fieldMetas.push({
            fid: rawField.fid,
            name: rawField.name,
            semanticType: rawField.semanticType,
            analyticType: rawField.analyticType,
            geoRole: rawField.geoRole,
            features,
            distribution,
            disable: rawField.disable,
        });
    }
    return fieldMetas;
}
