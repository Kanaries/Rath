import { BIN_SIZE, IFieldMeta } from '@kanaries/loa';
import { IFieldEncode } from '../../interfaces';

interface IFieldCatByScale {
    scaleEncodes: IFieldEncode[];
}
export function autoScale(fields: IFieldMeta[], encodes: IFieldEncode[]): IFieldCatByScale {
    const scaleEncodes: IFieldEncode[] = [];

    if (encodes.find((e) => e.aggregate === 'count')) {
        for (let field of fields) {
            if (field.semanticType === 'quantitative' && field.features.unique > BIN_SIZE) {
                scaleEncodes.push({
                    field: field.fid,
                    type: 'quantitative',
                    bin: true,
                    title: field.name || field.fid,
                });
            }
        }
    }

    return {
        scaleEncodes,
    };
}
