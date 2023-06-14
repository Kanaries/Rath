import { IFieldEncode } from "@kanaries/loa";
import { IFieldMeta, IResizeMode, IVegaSubset } from "../../interfaces";

export interface ISizeConfig {
    mode: IResizeMode;
    width?: number;
    height?: number;
    stepSize?: number;
    hasFacets: boolean;
}
export function applySizeConfig(spec: any, cnf: ISizeConfig): any {
    const {
        mode,
        width,
        height,
        stepSize,
        hasFacets
    } = cnf;
    if (mode === IResizeMode.auto && typeof stepSize === 'number') {
        if (typeof width === 'number' && spec.encoding && spec.encoding.x && spec.encoding.y) {
            const xFieldType = spec.encoding.x.type;
            spec.width = (xFieldType === 'quantitative' || xFieldType === 'temporal') ? width : { step: stepSize };
            
        }
        if (typeof height === 'number' && spec.encoding && spec.encoding.y) {
            const yFieldType = spec.encoding.y.type;
            spec.height = (yFieldType === 'quantitative' || yFieldType === 'temporal') ? height : { step: stepSize };
        }
    } else if (mode !== IResizeMode.auto) {
        spec.width = width
        spec.height = height;
        if (spec.encoding && spec.encoding.x) {
            spec.encoding.x.axis = { labelOverlap: true }
        }
        if (spec.encoding && spec.encoding.y) {
            spec.encoding.y.axis = { labelOverlap: true }
        }
        if (!hasFacets) {
            spec.autosize = 'fit'
        }
    }
    return spec;
}

export function encodingDecorate (encoding: any, fields: IFieldMeta[], statFields: IFieldMeta[]): boolean {
    const allFields = fields.concat(statFields)
    if (encoding.x && encoding.x.type === 'nominal') {
        if (encoding.y && encoding.y.type === 'quantitative') {
            const nominalField = allFields.find(f => f.fid === encoding.x.field);
            if (nominalField && nominalField.features.unique > 2) {
                encoding.x.axis = {
                    labelOverlap: true
                }
            }
            return true
        }
    }
    if (encoding.y && encoding.y.type === 'nominal') {
        if (encoding.x && encoding.x.type === 'quantitative') {
            const nominalField = allFields.find(f => f.fid === encoding.y.field);
            if (nominalField && nominalField.features.unique > 2) {
                encoding.y.axis = {
                    labelOverlap: true
                }
            }
        }
        return true
    }
    return false;
}

export function applyZeroScale (spec: IVegaSubset, includeZero: boolean) {
    if (!spec.config) {
        spec.config = {}
    }
    if (!spec.config.scale) {
        spec.config.scale = {}
    }
    spec.config.scale.zero = includeZero;
}

const COUNT_FIELD_ID = '__tmp_stat_id_unique'

export function splitFieldsByEnocdes (fields: IFieldMeta[], encodes: IFieldEncode[]) {
    const pureFields: IFieldMeta[] = [];
    const transedFields: IFieldMeta[] = [];
    for (let field of fields) {
        if (encodes.find(e => e.field === field.fid)) {
            transedFields.push(field);
        } else {
            pureFields.push(field);
        }
    }
    if (encodes.find(e => e.aggregate === 'count') && !fields.find(f => f.fid === COUNT_FIELD_ID)) {
        transedFields.push({
            fid: COUNT_FIELD_ID,
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
    }
    return {
        pureFields,
        transedFields
    }
}