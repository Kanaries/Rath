import { IFieldMeta, IRow } from "../interfaces";
import { binMap, BIN_SIZE, entropy, generalMic, mic, pureGeneralMic, rangeNormilize } from "@kanaries/loa";

interface ILoaView {
    fields: (IFieldMeta | '*')[];
    locked?: boolean;
}

function getCausers (fields: IFieldMeta[], relationMatrix: number[][], baseIndex: number): [number, number][] {
    let causers: [number, number][] = fields.map((f, fi) => [relationMatrix[fi][baseIndex], fi]);
    causers.sort((a, b) => b[0] - a[0])
    return causers;
}

function getEffects (fields: IFieldMeta[], relationMatrix: number[][], baseIndex: number): [number, number][] {
    let effects: [number, number][] = fields.map((f, fi) => [relationMatrix[baseIndex][fi], fi]);
    effects.sort((a, b) => b[0] - a[0])
    return effects;
}

function getSubMatrix<T = any> (mat: T[][], indices: number[]): T[][] {
    const size = indices.length;
    const subMat: T[][] = new Array(size).fill(0).map(() => new Array(size).fill(0));
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            subMat[i][j] = mat[indices[i]][indices[j]]
        }
    }
    return subMat;
}

function mergeCauserEffects (causers: [number, number][], effects: [number, number][]): [number, number][] {
    const ans: [number, number][] = []
    for (let i = 0; i < causers.length; i++) {
        ans.push([Math.max(causers[i][0], effects[i][0]), causers[i][1]])
    }
    return ans;
}

function recInternalRelation (relationMatrix: number[][], relationMarkMatrix: boolean[][], baseIndex: number): {
    from: number;
    to: number;
    score: number;
} | null {
    const causers: [number, number][] = [];
    const effects: [number, number][] = [];

    for (let i = 0; i < relationMatrix.length; i++) {
        if (i !== baseIndex) {
            causers.push([relationMatrix[i][baseIndex], i])
            effects.push([relationMatrix[baseIndex][i], i])
        }
    }
    let relations = mergeCauserEffects(causers, effects);
    relations.sort((a, b) => b[0] - a[0])

    for (let i = 0; i < relations.length; i++) {
        if (relationMarkMatrix[relations[i][1]][baseIndex] || relationMarkMatrix[baseIndex][relations[i][1]]) continue;
        return {
            from: baseIndex,
            to: relations[i][1],
            score: relations[i][0]
        }
    }

    return null;

}

function uniqueFieldMeta (fields: IFieldMeta[]) {
    const keySet = new Set(fields.map(f => f.fid));
    const keyMap: Map<string, boolean> = new Map();
    for (let f of fields) {
        keyMap.set(f.fid, true)
    }
    const ans: IFieldMeta[] = [];
    for (let f of fields) {
        if (keyMap.get(f.fid)) {
            keyMap.set(f.fid, false)
            ans.push(f)
        }
    }
    return ans
}

function selectRelation2Target(props: {
    causers: [number, number][];
    effects: [number, number][];
    wildCardNum: number;
    baseIndex: number;
    markMat: boolean[][]
}): {
    ansIndices: number[];
    leftWildCard: number
} {
    const { causers, effects, wildCardNum, baseIndex, markMat } = props;
    let wcn = wildCardNum;
    const ansIndices: number[] = []
    let cIndex = 0;
    let eIndex = 0;
    while((cIndex < causers.length || eIndex < effects.length) && wcn > 0) {
        if ((cIndex < causers.length && eIndex < effects.length && causers[cIndex][0] >= effects[eIndex][0]) || (cIndex < causers.length && eIndex >= effects.length)) {
            if (!markMat[causers[cIndex][1]][baseIndex] && causers[cIndex][0] > 0.01) {
                ansIndices.push(causers[cIndex][1]);
                markMat[causers[cIndex][1]][baseIndex] = markMat[baseIndex][causers[cIndex][1]] = true;
                wcn--;
            }
            cIndex++
        } else if ((cIndex < causers.length && eIndex < effects.length && causers[cIndex][0] < effects[eIndex][0]) || (cIndex >= causers.length || eIndex < effects.length)) {
            if (!markMat[baseIndex][effects[eIndex][1]] && effects[eIndex][0] > 0.01) {
                ansIndices.push(effects[eIndex][1]);
                markMat[baseIndex][effects[eIndex][1]] = markMat[effects[eIndex][1]][baseIndex]=  true;
                wcn--;
            }
            eIndex++
        }
    }
    return {
        ansIndices,
        leftWildCard: wcn
    }
}

interface IRelation2Group {
    relationMatrix: number[][];
    markMatrix: boolean[][];
    baseIndex: number;
    groupIndices: number[];
    wildCardNum: number
}
function selectRelation2Group(props: IRelation2Group) {
    const { relationMatrix, markMatrix, baseIndex, groupIndices, wildCardNum } = props;
    let wcn = wildCardNum;
    const vertices: [number, number][] = []
    const selectedVertices: [number, number][] = []
    for (let i = 0; i < groupIndices.length; i++) {
        const score = Math.max(relationMatrix[baseIndex][groupIndices[i]], relationMatrix[groupIndices[i]][baseIndex])
        vertices.push([score, groupIndices[i]])
    }
    vertices.sort((a, b) => b[0] - a[0])
    for (let i = 0; i < vertices.length; i++) {
        if (vertices[i][0] < 0.01) break;
        if ((markMatrix[vertices[i][1]][baseIndex] || markMatrix[baseIndex][vertices[i][1]]) && wcn > 0) {
            selectedVertices.push(vertices[i])
        }
    }
    return {
        selectedVertices,
        wcn
    }
}

function uniqueArrValue (arr: number[]): number[] {
    const set = new Set(arr);
    return [...set.values()]
}

function findStrongestEdge2GroupNotMarked(mat: number[][], markMat: boolean[][], indices: number[]): {
    score: number;
    from: number;
    to: number;
} {
    let ans = {
        score: -1,
        from: -1,
        to: -1
    }
    for (let i = 0; i < indices.length; i++) {
        const baseIndex = indices[i];
        for (let j = 0; j < mat.length; j++) {
            if (j === baseIndex || markMat[baseIndex][j] || markMat[j][baseIndex]) continue;
            if (mat[baseIndex][j] > ans.score || mat[j][baseIndex] > ans.score) {
                ans.score = Math.max(mat[baseIndex][j], mat[j][baseIndex])
                ans.from = baseIndex;
                ans.to = j;
            }
        }
    }
    return ans;
}
interface IExtendSpecGroup {
    relationMatrix: number[][];
    markMatrix: boolean[][];
    groupIndices: number[];
    wildCardNum: number
}
function extendSpecGroup(props: IExtendSpecGroup) {
    const { relationMatrix, markMatrix, groupIndices, wildCardNum } = props;
    let wcn = wildCardNum;
    const vertexIndices: number[] = []
    const edges: [number, number][] = []
    let dynamicGroupIndices: number[] = [...groupIndices];
    while(wcn > 1) {
        const sEdge = findStrongestEdge2GroupNotMarked(relationMatrix, markMatrix, dynamicGroupIndices)
        if (sEdge.to >= 0) {
            wcn--;
            vertexIndices.push(sEdge.from, sEdge.to);
            dynamicGroupIndices.push(sEdge.to)
            edges.push([sEdge.from, sEdge.to])
        } else {
            break;
        }
    }
    return {
        vertexIndices: uniqueArrValue(vertexIndices),
        edges,
        leftWildCardNum: wcn
    }
}

function markUsedRelation (markMatrix: boolean[][], edges: [number, number][]) {
    for (let edge of edges) {
        markMatrix[edge[0]][edge[1]] = markMatrix[edge[1]][edge[0]] = true
    }
}

// idea list
// 1. 优先locked变量直接的关系
// 2. extend measure , extend dimension, extend filter, reduce(general)
export function autoSet(dataSource: IRow[], fields: IFieldMeta[], views: ILoaView[], linkGraph?: number[][]) {
    // 1. check status of placeholder
    // 2. 确认确定的信息集合，和不确定的集合。根据确定的集合，推荐不确定的集合。
    // 3. 推荐逻辑，

    // 如果有主view
    const lockedFieldSet: IFieldMeta[] = [];
    const lockedFieldWeightsMap: Map<string, number> = new Map();
    const fieldIndexMap: Map<string, number> = new Map();
    for (let i = 0; i < fields.length; i++) {
        fieldIndexMap.set(fields[i].fid, i)
    }
    for (let view of views) {
        for (let f of view.fields) {
            if (f !== '*') {
                lockedFieldSet.push(f);
                lockedFieldWeightsMap.set(f.fid, (lockedFieldWeightsMap.get(f.fid) || 0) + 1)
            }
        }
    }
    const lockedFieldIndices = lockedFieldSet.map(f => fieldIndexMap.get(f.fid)!);
    const lockedFieldWeights = [...lockedFieldWeightsMap.entries()].sort((a, b) => b[1] - a[1]);
    let fieldIndex = 0;
    const relationMatrix: number[][] = getFieldRelationMatrix(dataSource, fields);
    const relationMarkMatrix: boolean[][] = new Array(fields.length).fill(false).map(() => new Array(fields.length).fill(false));
    for (let view of views) {
        const fieldIndices = (view.fields.filter(f => f !== '*') as IFieldMeta[]).map(f => fieldIndexMap.get(f.fid)!);
        for (let i = 0; i < fieldIndices.length; i++) {
            for (let j = 0; j < fieldIndices.length; j++) {
                if (fieldIndices[i] !== fieldIndices[j]) {
                    relationMarkMatrix[fieldIndices[i]][fieldIndices[j]] = relationMarkMatrix[fieldIndices[j]][fieldIndices[i]] = true
                }
            }
        }
    }
    const ansViews: ILoaView[] = [];
    for (let view of views) {
        const viewFields = view.fields;
        let ansFields: IFieldMeta[] = view.fields.filter(f => f !== '*') as IFieldMeta[];
        if (!view.locked && viewFields.length > ansFields.length) {
            const placeholders = viewFields.filter(f => f === '*');
            if (placeholders.length === viewFields.length) {
                let remainPlaceholderNum = placeholders.length;
                fieldIndex = 0
                // const groupIndices = lockedFieldIndices
                const {
                    vertexIndices,
                    leftWildCardNum,
                    edges
                } = extendSpecGroup({
                    relationMatrix,
                    markMatrix: relationMarkMatrix,
                    groupIndices: lockedFieldIndices,
                    wildCardNum: remainPlaceholderNum
                })
                remainPlaceholderNum = leftWildCardNum;
                ansFields.push(...vertexIndices.map(ind => fields[ind]))
                markUsedRelation(relationMarkMatrix, edges);
                // while(remainPlaceholderNum > 0 && fieldIndex < lockedFieldWeights.length) {
                //     const targetFieldKey = lockedFieldWeights[fieldIndex][0];
                //     const targetFieldIndexInMatrix = fieldIndexMap.get(targetFieldKey)!;
                //     const causers = getCausers(fields, relationMatrix, targetFieldIndexInMatrix);
                //     const effects = getEffects(fields, relationMatrix, targetFieldIndexInMatrix);
                //     // console.log(fields[targetFieldIndexInMatrix].name, causers.map(c => `${fields[c[1]].name},${c[0]}`))
                //     // console.log(fields[targetFieldIndexInMatrix].name, effects.map(c => `${fields[c[1]].name},${c[0]}`))
                //     let cIndex = 0;
                //     let eIndex = 0;
                //     while((cIndex < causers.length || eIndex < effects.length) && remainPlaceholderNum > 0) {
                //         if ((cIndex < causers.length && eIndex < effects.length && causers[cIndex][0] >= effects[eIndex][0]) || (cIndex < causers.length && eIndex >= effects.length)) {
                //             if (!relationMarkMatrix[causers[cIndex][1]][targetFieldIndexInMatrix] && causers[cIndex][0] > 0.01) {
                //                 ansFields.push(fields[causers[cIndex][1]]);
                //                 relationMarkMatrix[causers[cIndex][1]][targetFieldIndexInMatrix] = relationMarkMatrix[targetFieldIndexInMatrix][causers[cIndex][1]] = true;
                //                 remainPlaceholderNum--;
                //             }
                //             cIndex++
                //         } else if ((cIndex < causers.length && eIndex < effects.length && causers[cIndex][0] < effects[eIndex][0]) || (cIndex >= causers.length || eIndex < effects.length)) {
                //             if (!relationMarkMatrix[targetFieldIndexInMatrix][effects[eIndex][1]] && effects[eIndex][0] > 0.01) {
                //                 ansFields.push(fields[effects[eIndex][1]]);
                //                 relationMarkMatrix[targetFieldIndexInMatrix][effects[eIndex][1]] = relationMarkMatrix[effects[eIndex][1]][targetFieldIndexInMatrix]=  true;
                //                 remainPlaceholderNum--;
                //             }
                //             eIndex++
                //         }
                //     }

                //     if (causers.filter(ca => ca[0] > 0).every(ca => relationMarkMatrix[ca[1]][targetFieldIndexInMatrix])) {
                //         if (effects.filter(ef => ef[0] > 0).every(ef => relationMarkMatrix[targetFieldIndexInMatrix][ef[1]])) {
                //             fieldIndex++;
                //         }
                //     }
                // }
                for (let i = 0; i < relationMarkMatrix.length; i++) {
                    relationMarkMatrix[i][i] = false;
                }
            } else {
                // cases when placeholders.length !== viewFields.length
                // 动态调整，以视图内的非placeholder的点为最高优先级。
                let localLockedFieldWeights = lockedFieldWeights.filter(loc => viewFields.find(f => f !== '*' && f.fid === loc[0]));
                // TODO：优先看当前的wildcard内部的匹配关系，如果没有已有的关系，则添加。
                let remainPlaceholderNum = placeholders.length;
                fieldIndex = 0
                for (let i = 0; i < relationMarkMatrix.length; i++) {
                    relationMarkMatrix[i][i] = true;
                }
                const specifiedFields = viewFields.filter(f => f !== '*') as IFieldMeta[];
                const sfIndices: number[] = lockedFieldSet.map(f => fieldIndexMap.get(f.fid)!);
                const localRelationMatrix = getSubMatrix<number>(relationMatrix, sfIndices);
                // console.log('in local', localRelationMatrix, lockedFieldSet.map(l => l.name || l.fid))
                for (let i = 0; i < specifiedFields.length; i++) {
                    // if (specifiedFields[i].fid === 'Year') debugger;
                    const localRelationMarkMatrix = getSubMatrix<boolean>(relationMarkMatrix, sfIndices);

                    const targetIndex = lockedFieldSet.findIndex(f => f.fid === specifiedFields[i].fid)
                    const rec = recInternalRelation(localRelationMatrix, localRelationMarkMatrix, targetIndex)
                    if (rec !== null) {
                        if (ansFields.find(f => f.fid === fields[sfIndices[rec.to]].fid)) {
                            continue;
                        }
                        localRelationMarkMatrix[rec.from][rec.to] = localRelationMarkMatrix[rec.to][rec.from] = true;
                        relationMarkMatrix[sfIndices[rec.from]][sfIndices[rec.to]] = relationMarkMatrix[sfIndices[rec.to]][sfIndices[rec.from]] = true
                        remainPlaceholderNum--;
                        ansFields.push(fields[sfIndices[rec.to]])
                    }
                }
                // console.log('end local', ansFields.length, ansFields.map(f => f.fid || f.name))
                // debugger
                const {
                    vertexIndices,
                    leftWildCardNum,
                    edges
                } = extendSpecGroup({
                    relationMatrix,
                    markMatrix: relationMarkMatrix,
                    groupIndices: lockedFieldIndices,
                    wildCardNum: remainPlaceholderNum + 1
                })
                remainPlaceholderNum = leftWildCardNum;
                ansFields.push(...vertexIndices.map(ind => fields[ind]))
                markUsedRelation(relationMarkMatrix, edges);
                // while(remainPlaceholderNum > 0 && fieldIndex < localLockedFieldWeights.length) {
                //     const targetFieldKey = localLockedFieldWeights[fieldIndex][0];
                //     const targetFieldIndexInMatrix = fieldIndexMap.get(targetFieldKey)!;
                //     const causers = getCausers(fields, relationMatrix, targetFieldIndexInMatrix);
                //     const effects = getEffects(fields, relationMatrix, targetFieldIndexInMatrix);
                //     if (!ansFields.find(f => f.analyticType === 'measure')) {
                //         for (let i = 0; i < fields.length; i++) {
                //             if (fields[causers[i][1]].analyticType === 'measure') {
                //                 causers[i][0]++;
                //             }
                //         }
                //         for (let i = 0; i < fields.length; i++) {
                //             if (fields[effects[i][1]].analyticType === 'measure') {
                //                 effects[i][0]++;
                //             }
                //         }
                //         console.log({
                //             causers,
                //             effects
                //         })
                //         causers.sort((a, b) => b[0] - a[0])
                //         effects.sort((a, b) => b[0] - a[0])
                //     }
                //     // console.log(fields[targetFieldIndexInMatrix].name, causers.map(c => `${fields[c[1]].name},${c[0]}`))
                //     // console.log(fields[targetFieldIndexInMatrix].name, effects.map(c => `${fields[c[1]].name},${c[0]}`))
                //     let cIndex = 0;
                //     let eIndex = 0;
                //     while((cIndex < causers.length || eIndex < effects.length) && remainPlaceholderNum > 0) {
                //         if ((cIndex < causers.length && eIndex < effects.length && causers[cIndex][0] >= effects[eIndex][0]) || (cIndex < causers.length && eIndex >= effects.length)) {
                //             if (!relationMarkMatrix[causers[cIndex][1]][targetFieldIndexInMatrix] && causers[cIndex][0] > 0.01) {
                //                 ansFields.push(fields[causers[cIndex][1]]);
                //                 relationMarkMatrix[causers[cIndex][1]][targetFieldIndexInMatrix] = relationMarkMatrix[targetFieldIndexInMatrix][causers[cIndex][1]]= true;
                //                 remainPlaceholderNum--;
                //             }
                //             cIndex++
                //         } else if ((cIndex < causers.length && eIndex < effects.length && causers[cIndex][0] < effects[eIndex][0]) || (cIndex >= causers.length || eIndex < effects.length)) {
                //             if (!relationMarkMatrix[targetFieldIndexInMatrix][effects[eIndex][1]] && effects[eIndex][0] > 0.01) {
                //                 ansFields.push(fields[effects[eIndex][1]]);
                //                 relationMarkMatrix[targetFieldIndexInMatrix][effects[eIndex][1]] = relationMarkMatrix[effects[eIndex][1]][targetFieldIndexInMatrix] = true;
                //                 remainPlaceholderNum--;
                //             }
                //             eIndex++
                //         }
                //     }

                //     if (causers.filter(ca => ca[0] > 0).every(ca => relationMarkMatrix[ca[1]][targetFieldIndexInMatrix])) {
                //         if (effects.filter(ef => ef[0] > 0).every(ef => relationMarkMatrix[targetFieldIndexInMatrix][ef[1]])) {
                //             fieldIndex++;
                //         }
                //     }
                // }
                for (let i = 0; i < relationMarkMatrix.length; i++) {
                    relationMarkMatrix[i][i] = false;
                }
            }
        } else {
            ansFields = view.fields.filter(f => f !== '*') as IFieldMeta[];
        }
        console.log('ans fields', ansFields, view.fields, ansFields.map(af => ansFields.map(af2 => relationMatrix[fieldIndexMap.get(af.fid)!][fieldIndexMap.get(af2.fid)!])))
        ansViews.push({
            ...view,
            fields: uniqueFieldMeta(ansFields)
        })
    }
    return ansViews
}

function getFieldRelationMatrix (dataSource: IRow[], fields: IFieldMeta[]) {
    const size = fields.length;
    let relationMatrix: number[][] = new Array(size).fill(0).map(() => new Array(size).fill(0));
    for (let i = 0; i < fields.length; i++) {
        for (let j = 0; j < fields.length; j++) {
            if (i === j) {
                relationMatrix[i][j] = 1;
                continue;
            }
            const X = dataSource.map(r => r[fields[i].fid]);
            const Y = dataSource.map(r => r[fields[j].fid]);
            if (fields[i].semanticType === 'quantitative' && fields[j].semanticType === 'quantitative') {
                relationMatrix[i][j] = mic(X, Y);
            }
            if (fields[i].semanticType !== 'quantitative' && fields[j].semanticType === 'quantitative') {
                if (fields[i].semanticType === 'temporal')relationMatrix[i][j] = pureGeneralMic(X, Y)
                else relationMatrix[i][j] = generalMic(X, Y)
            }
            if (fields[i].semanticType === 'quantitative' && fields[j].semanticType !== 'quantitative') {
                if (fields[j].semanticType === 'temporal') relationMatrix[i][j] = inverseGeneralMic(X, Y, getTemporalFreqRange)
                else relationMatrix[i][j] = inverseGeneralMic(X, Y)
            }
            if (fields[i].semanticType !== 'quantitative' && fields[j].semanticType !== 'quantitative') {
                if (fields[j].semanticType === 'temporal') relationMatrix[i][j] = nnMic(X, Y, getTemporalFreqRange)
                // 这里如果要用hack的temporal解法的话，需要用purennmic来做T-T类型。但是我们目前并不想提升T-T类型。不如等到之后时间系统改造完用正规的方法搞。
                else relationMatrix[i][j] = nnMic(X, Y)
            }
        }
    }
    return relationMatrix
}

const SPLITOR = '_l_'

function getFreqMap (values: any[]): Map<any, number> {
    const counter: Map<any, number> = new Map();
    for (let val of values) {
        if (!counter.has(val)) {
            counter.set(val, 0)
        }
        counter.set(val, counter.get(val)! + 1)
    }
    return counter
}

export function liteGroupBy(values: any[], by: any[]): Map<any, any[]> {
    const groups: Map<any, any[]> = new Map();
    for (let i = 0; i < values.length; i++) {
        let g = groups.get(by[i]) || [];
        g.push(values[i])
        groups.set(by[i], g)
    }
    return groups;
}

/**
 * 返回一个BIN_SIZE大小的元素数组，包含了freq前16
 */
export function getFreqRange (values: any[]): any[] {
    const FM = getFreqMap(values);
    const sortedFM = [...FM.entries()].sort((a, b) => b[1] - a[1])
    return sortedFM.slice(0, BIN_SIZE);
}

/**
 * 返回一个BIN_SIZE大小的元素数组，包含了freq前16
 */
 export function getTemporalFreqRange (values: any[]): any[] {
    const FM = getFreqMap(values);
    const sortedFM = [...FM.entries()].sort((a, b) => b[1] - a[1])
    return sortedFM
}

export function binGroupByShareFreqRange (Y: any[], range: any[]): number[] {
    const fl: number[] = new Array(range.length).fill(0);
    const rangeIndices: Map<any, number> = new Map();
    // for (let val of range) {
    for (let i = 0; i < range.length; i++) {
        rangeIndices.set(range[i], i);
    }
    for (let val of Y) {
        if (rangeIndices.has(val)) {
            fl[rangeIndices.get(val)!]++;
        } else {
            fl[fl.length - 1]++;
        }
    }
    return fl;
}

// function addVec (vec1: number[], vec2: number[]) {
//     let size = Math.min(vec1.length, vec2.length);
//     let ans = new Array(size).fill(0);
//     for (let i = 0; i < size; i++) {
//         ans[i] = vec1[i] + vec2[i]
//     }
//     return ans;
// }

function vecAdd (mutVec: number[], inc: number[]) {
    const size = Math.min(mutVec.length, inc.length);
    for (let i = 0; i < size; i++) {
        mutVec[i] += inc[i];
    }
}

function inverseGeneralMic (X: number[], Y: any[], FR: (values: any[]) => any[] | undefined = getFreqRange) {
    const binTags = binMap(X);
    // const FM = getFreqMap(Y);
    const globalRange = getFreqRange(Y)
    // console.log('g range', globalRange)
    const groups = liteGroupBy(Y, binTags)
    // 这里groups.size = BIN_SZIE
    let condH = 0;
    let globalFl = new Array(globalRange.length).fill(0);
    for (let [sgKey, subGroup] of groups) {
        const p = subGroup.length / Y.length;
        const subFl = binGroupByShareFreqRange(subGroup, globalRange);
        const subEnt = entropy(rangeNormilize(subFl.filter(v => v > 0)))
        condH += p * subEnt;
        vecAdd(globalFl, subFl);
    }
    const H = entropy(rangeNormilize(globalFl.filter(v => v > 0)))
    return (H - condH) / Math.log2(Math.min(BIN_SIZE, globalRange.length))
}

function nnMic (X: any[], Y: any[], FR: (values: any[]) => any[] | undefined = getFreqRange) {
    // const FM = getFreqMap(Y);
    // const globalRange = [...FM.keys()];
    const globalRange = getFreqRange(Y)

    const groups = liteGroupBy(Y, X)

    const sortedGroup = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
    // for (let group of sortedGroup)
    let usedGroupNum = Math.min(sortedGroup.length, BIN_SIZE - 1)
    let i = 0;
    let condH = 0;
    let globalFl = new Array(globalRange.length).fill(0);
    for (i = 0; i < usedGroupNum; i++) {
        const p = sortedGroup[i][1].length / Y.length;
        const subFl = binGroupByShareFreqRange(sortedGroup[i][1], globalRange)
        const subEnt = entropy(rangeNormilize(subFl.filter(v => v > 0)))
        condH += subEnt * p;
        vecAdd(globalFl, subFl);
    }

    if (sortedGroup.length > usedGroupNum) {
        let noiseFl = new Array(BIN_SIZE).fill(0);
        let noiseP = 0;
        for (; i < sortedGroup.length; i++) {
            const subFl = binGroupByShareFreqRange(sortedGroup[i][1], globalRange)
            noiseP += sortedGroup[i][1].length;
            vecAdd(noiseFl, subFl)
        }
        noiseP /= Y.length;
        const noiseEnt = entropy(rangeNormilize(noiseFl.filter(v => v > 0)))
        condH += noiseP * noiseEnt
        vecAdd(globalFl, noiseFl)
    }
    const H = entropy(rangeNormilize(globalFl.filter(v => v > 0)))
    return (H - condH) / Math.log2(Math.min(BIN_SIZE, globalRange.length))

}
/**
 * no noise
 * @param X 
 * @param Y 
 * @param FR 
 * @returns 
 */
function purennMic (X: any[], Y: any[], FR: (values: any[]) => any[] | undefined = getFreqRange) {
    // const FM = getFreqMap(Y);
    // const globalRange = [...FM.keys()];
    const globalRange = getFreqRange(Y)

    const groups = liteGroupBy(Y, X)

    const sortedGroup = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
    // for (let group of sortedGroup)
    let usedGroupNum = sortedGroup.length
    let i = 0;
    let condH = 0;
    let globalFl = new Array(globalRange.length).fill(0);
    for (i = 0; i < usedGroupNum; i++) {
        const p = sortedGroup[i][1].length / Y.length;
        const subFl = binGroupByShareFreqRange(sortedGroup[i][1], globalRange)
        const subEnt = entropy(rangeNormilize(subFl.filter(v => v > 0)))
        condH += subEnt * p;
        vecAdd(globalFl, subFl);
    }

    // if (sortedGroup.length > usedGroupNum) {
    //     let noiseFl = new Array(BIN_SIZE).fill(0);
    //     let noiseP = 0;
    //     for (; i < sortedGroup.length; i++) {
    //         const subFl = binGroupByShareFreqRange(sortedGroup[i][1], globalRange)
    //         noiseP += sortedGroup[i][1].length;
    //         vecAdd(noiseFl, subFl)
    //     }
    //     noiseP /= Y.length;
    //     const noiseEnt = entropy(rangeNormilize(noiseFl.filter(v => v > 0)))
    //     condH += noiseP * noiseEnt
    //     vecAdd(globalFl, noiseFl)
    // }
    const H = entropy(rangeNormilize(globalFl.filter(v => v > 0)))
    return (H - condH) / Math.log2(Math.min(BIN_SIZE, globalRange.length))

}

// function recommendBasedOnTargets (originWildCardNum: number) {
//     let wildCardNum = originWildCardNum;
//     const ansFields: IFieldMeta[] = [];
//     while(wildCardNum > 0 && fieldIndex < lockedFieldWeights.length) {
//         const targetFieldKey = lockedFieldWeights[fieldIndex][0];
//         const targetFieldIndexInMatrix = fieldIndexMap.get(targetFieldKey)!;
//         // ansFields.push(fields[targetFieldIndexInMatrix])
//         // wildCardNum--;
//         let causers: [number, number][] = fields.map((f, fi) => [relationMatrix[fi][targetFieldIndexInMatrix], fi]);
//         let effects: [number, number][] = fields.map((f, fi) => [relationMatrix[targetFieldIndexInMatrix][fi], fi]);
//         causers.sort((a, b) => b[0] - a[0])
//         effects.sort((a, b) => b[0] - a[0])
//         console.log(fields[targetFieldIndexInMatrix].name, causers.map(c => `${fields[c[1]].name},${c[0]}`))
//         console.log(fields[targetFieldIndexInMatrix].name, effects.map(c => `${fields[c[1]].name},${c[0]}`))
//         let cIndex = 0;
//         let eIndex = 0;
//         while((cIndex < causers.length || eIndex < effects.length) && wildCardNum > 0) {
//             if (causers[cIndex][0] >= effects[eIndex][0]) {
//                 if (!relationMarkMatrix[causers[cIndex][1]][targetFieldIndexInMatrix] && causers[cIndex][0] > 0) {
//                     ansFields.push(fields[causers[cIndex][1]]);
//                     relationMarkMatrix[causers[cIndex][1]][targetFieldIndexInMatrix] = true;
//                     wildCardNum--;
//                 }
//                 cIndex++
//             } else {
//                 if (!relationMarkMatrix[targetFieldIndexInMatrix][effects[eIndex][1]] && effects[eIndex][0] > 0.6) {
//                     ansFields.push(fields[effects[eIndex][1]]);
//                     relationMarkMatrix[targetFieldIndexInMatrix][effects[eIndex][1]] = true;
//                     wildCardNum--;
//                 }
//                 eIndex++
//             }
//         }
// }