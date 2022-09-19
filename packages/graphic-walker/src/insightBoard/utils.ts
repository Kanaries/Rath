import { IField, IMeasure } from "../interfaces";
/**
 * 合并两个measures数组，若出现相同的key，使用measures2中的op替换1中的op
 * @param measures1 
 * @param measures2 
 */
export function mergeMeasures(measures1: IMeasure[], measures2: IMeasure[]): IMeasure[] {
    const measureKeys: Set<string> = new Set();
    const merged: IMeasure[] = [];
    for (let mea of measures1) {
        measureKeys.add(mea.key);
        merged.push(mea);
    }
    for (let mea of measures2) {
        // measureKeys.add(mea.k)
        if (measureKeys.has(mea.key)) {
            const targetIndex = merged.findIndex(f => f.key === mea.key);
            if (targetIndex > -1) {
                merged[targetIndex] = mea;
            }
        } else {
            measureKeys.add(mea.key);
            merged.push(mea)
        }
    }
    return merged;
}

export function formatFieldName(fid: string, fields: Readonly<IField[]>) {
    const target = fields.find(f => f.fid === fid);
    return target ? target.name : fid;
}