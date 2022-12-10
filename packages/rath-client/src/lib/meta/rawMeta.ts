import { IRawFeatures, IRawField, IRow } from "../../interfaces";

export function computeRawFieldFeatures (fields: IRawField[], dataSource: IRow[]): IRawFeatures[] {
    const features: IRawFeatures[] = [];
    for (let field of fields) {
        let valid = 0;
        let missing = 0;
        const valueSet: Set<any> = new Set();
        for (let i = 0; i < dataSource.length; i++) {
            const value = dataSource[i][field.fid];
            if (value === null || value === undefined || value === '') {
                missing++;
            }
            if (field.semanticType === 'quantitative') {
                if (typeof value === 'number') {
                    valid++;
                }
            } else {
                valid++;
            }
            valueSet.add(value)
        }
        features.push({
            fid: field.fid,
            valid,
            missing,
            unique: valueSet.size,
            mismatch: dataSource.length - valid - missing
        })
    }
    return features;

}