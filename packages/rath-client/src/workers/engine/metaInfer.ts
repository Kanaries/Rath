import { IAnalyticType, IRow, ISemanticType } from "visual-insights";
import { IGeoRole, IMuteFieldBase, IRawField } from "../../interfaces";
import { inferIDFromName } from "../../lib/meta/infer";
import { inferAnalyticTypeFromSemanticType, inferSemanticType } from "../../utils";

function emptyCount (dataSource: IRow[], colKey: string): number {
    // const counter: Map<string, number> = new Map();
    let counter = 0;
    for (let i = 0; i < dataSource.length; i++) {
        if (dataSource[i][colKey] === null || dataSource[i][colKey] === undefined || dataSource[i][colKey] === '') {
            counter++;
        }
    }
    return counter
}

function inferDisable (dataSource: IRow[], colKey: string) {
    // 1. sparse column
    // 2. constant column
    const emptyAmount = emptyCount(dataSource, colKey);
    if (emptyAmount / dataSource.length > 0.25) {
        return true;
    }
    let valueSet: Set<any> = new Set();
    for (let i = 0; i < dataSource.length; i++) {
        if (dataSource[i][colKey] !== null && dataSource[i][colKey] !== '' && dataSource[i][colKey] !== undefined) {
            valueSet.add(dataSource[i][colKey])
        }
    }
    if (valueSet.size === 1) return true;
    if (valueSet.size > 50 && valueSet.size === dataSource.length) {
        for (let v of valueSet) {
            if (typeof v !== 'string' && !Number.isInteger(v)) {
                return false;
            }
        }
        return true;
    }

    return false;
}

function inferGeoRole(dataSource: IRow[], colKey: string, semanticType: ISemanticType, colName: string): IGeoRole {
    if (semanticType === 'quantitative') {
        if (['longitude', 'lon', '经度'].includes(colName)) return 'longitude';
        if (['latitude', 'lat', '纬度'].includes(colName)) return 'latitude';
    }
    return 'none'
}

export function inferMeta (props: { dataSource: IRow[]; fields: IMuteFieldBase[] }) {
    const { dataSource, fields } = props;
    const finalFieldMetas: IRawField[] = [];
    for (let field of fields) {
        let semanticType: ISemanticType = field.semanticType === '?' ? inferSemanticType(dataSource, field.fid) : field.semanticType;
        let geoRole = (field.geoRole === '?' || field.geoRole === undefined) ? inferGeoRole(dataSource, field.fid, semanticType, field.name || '') : field.geoRole;
        let analyticType: IAnalyticType = 'dimension';
        if (geoRole === 'none') {
            analyticType = field.analyticType === '?' ? inferAnalyticTypeFromSemanticType(semanticType) : field.analyticType;
        }
        const likeID = inferIDFromName(field.name);
        if (likeID) {
            analyticType = 'dimension';
            semanticType = semanticType === 'quantitative' ? 'ordinal' : semanticType
        }
        const disable: boolean = field.disable === '?' ? inferDisable(dataSource, field.fid) : Boolean(field.disable);
        finalFieldMetas.push({
            fid: field.fid,
            name: field.name ? field.name : field.fid,
            analyticType,
            semanticType,
            disable,
            geoRole
        })
    }
    return finalFieldMetas
}