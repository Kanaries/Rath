import { BIN_SIZE, getFreqMap } from "@kanaries/loa";
import { IFieldMeta, IRow } from "../../interfaces";

function getValueTuple (row: IRow, fields: IFieldMeta[]) {
    let tuple = '';
    for (let field of fields) {
        if (field.semanticType === 'quantitative') {
            let idx = Math.floor((field.features.max - row[field.fid]) / ((field.features.max - field.features.min) / BIN_SIZE))
            idx = Math.min(idx, BIN_SIZE);
            tuple += idx
        } else {
            tuple += row[field.fid]
        }
        tuple += '_'
    }
    return tuple
}

export function estimateDistribution (data: IRow[], fields: IFieldMeta[]) {
    const encodedData: string[] = [];
    for (let i = 0; i < data.length; i++) {
        let tuple = getValueTuple(data[i], fields)
        encodedData.push(tuple)
    }
    const freqMap = getFreqMap(encodedData)
    for (let t of freqMap.keys()) {
        freqMap.set(t, freqMap.get(t)! / data.length)
    }
    return freqMap;
}

export function viewSampling (data: IRow[], fields: IFieldMeta[], sampleSize: number): IRow[] {
    const distProbMap = estimateDistribution(data, fields);
    const sizeMap: Map<string, number> = new Map();
    const counterMap: Map<string, number> = new Map();
    const sampleMap: Map<string, IRow[]> = new Map();
    for (let t of distProbMap.keys()) {
        sizeMap.set(t, Math.round(distProbMap.get(t)! * sampleSize))
        counterMap.set(t, 0)
        sampleMap.set(t, [])
    }
    let samples: IRow[] = [];
    for (let i = 0; i < data.length; i++) {
        let tuple = getValueTuple(data[i], fields);
        counterMap.set(tuple, counterMap.get(tuple)! + 1)
        if (sampleMap.get(tuple)!.length < sizeMap.get(tuple)!) {
            sampleMap.get(tuple)!.push(data[i])
        } else {
            let idx = Math.floor(Math.random() * counterMap.get(tuple)!)
            if (idx < sizeMap.get(tuple)!) {
                sampleMap.get(tuple)![idx] = data[i]
            }
        }
    }
    for (let [, values] of sampleMap.entries()) {
        for (let val of values) {
            samples.push(val);
        }
    }
    return samples
}