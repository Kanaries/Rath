import { binMap, mic, nnMic, inverseGeneralMic, pureGeneralMic, getTemporalFreqRange, generalMic, getFreqRange } from "@kanaries/loa";
import dayjs from "dayjs";
import { IFieldMeta, IRow } from "../../interfaces";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function conditionalMic (condField: IFieldMeta, xField: IFieldMeta, yField: IFieldMeta, dataSource: IRow[]) {
    let condValues: any[] = dataSource.map(row => row[condField.fid])
    if (condField.semanticType === 'quantitative') {
        condValues = binMap(condValues);
    }
    // const uniqueCondValues = getFR Array.from(new Set(condValues));
    const uniqueCondValues = getFreqRange(condValues).map(f => f[0]);
    let totalScore = 0
    for (let i = 0; i < uniqueCondValues.length - 1; i++) {
        const cond = uniqueCondValues[i];
        const filteredDataSource = dataSource.filter(row => row[condField.fid] === cond);
        if (filteredDataSource.length < 40) continue
        let score = 0;
        const X = filteredDataSource.map(row => row[xField.fid]);
        const Y = filteredDataSource.map(row => row[yField.fid]);
        if (xField.semanticType === 'quantitative' && yField.semanticType === 'quantitative') {
            score = mic(X, Y);
        }
        if (xField.semanticType !== 'quantitative' && yField.semanticType === 'quantitative') {
            if (xField.semanticType === 'temporal')score = pureGeneralMic(X, Y)
            else score = generalMic(X, Y)
        }
        if (xField.semanticType === 'quantitative' && yField.semanticType !== 'quantitative') {
            if (yField.semanticType === 'temporal') score = inverseGeneralMic(X, Y, getTemporalFreqRange)
            else score = inverseGeneralMic(X, Y)
        }
        if (xField.semanticType !== 'quantitative' && yField.semanticType !== 'quantitative') {
            if (yField.semanticType === 'temporal') score = nnMic(X, Y, getTemporalFreqRange)
            // 这里如果要用hack的temporal解法的话，需要用purennmic来做T-T类型。但是我们目前并不想提升T-T类型。不如等到之后时间系统改造完用正规的方法搞。
            else score = nnMic(X, Y)
        }
        totalScore += score * filteredDataSource.length / dataSource.length;
    }
    // eslint-disable-next-line no-constant-condition
    if (true) {
        const cond = new Set(uniqueCondValues.slice(0, -1));
        const filteredDataSource = dataSource.filter(row => !cond.has(row[condField.fid]));
        if (filteredDataSource.length > 40) {
            let score = 0;
            const X = filteredDataSource.map(row => row[xField.fid]);
            const Y = filteredDataSource.map(row => row[yField.fid]);
            if (xField.semanticType === 'quantitative' && yField.semanticType === 'quantitative') {
                score = mic(X, Y);
            }
            if (xField.semanticType !== 'quantitative' && yField.semanticType === 'quantitative') {
                if (xField.semanticType === 'temporal')score = pureGeneralMic(X, Y)
                else score = generalMic(X, Y)
            }
            if (xField.semanticType === 'quantitative' && yField.semanticType !== 'quantitative') {
                if (yField.semanticType === 'temporal') score = inverseGeneralMic(X, Y, getTemporalFreqRange)
                else score = inverseGeneralMic(X, Y)
            }
            if (xField.semanticType !== 'quantitative' && yField.semanticType !== 'quantitative') {
                if (yField.semanticType === 'temporal') score = nnMic(X, Y, getTemporalFreqRange)
                // 这里如果要用hack的temporal解法的话，需要用purennmic来做T-T类型。但是我们目前并不想提升T-T类型。不如等到之后时间系统改造完用正规的方法搞。
                else score = nnMic(X, Y)
            }
            totalScore += score * filteredDataSource.length / dataSource.length;
        }
    }

    return totalScore;
}

function conditionaExtremelMic (condField: IFieldMeta, xField: IFieldMeta, yField: IFieldMeta, dataSource: IRow[]) {
    let condValues: any[] = dataSource.map(row => row[condField.fid])
    if (condField.semanticType === 'quantitative') {
        condValues = binMap(condValues);
    }
    // const uniqueCondValues = getFR Array.from(new Set(condValues));
    const uniqueCondValues = getFreqRange(condValues).map(f => f[0]);
    let totalScore = 1
    for (let i = 0; i < uniqueCondValues.length - 1; i++) {
        const cond = uniqueCondValues[i];
        const filteredDataSource = dataSource.filter(row => row[condField.fid] === cond);
        if (filteredDataSource.length < 16) continue
        let score = 0;
        const X = filteredDataSource.map(row => row[xField.fid]);
        const Y = filteredDataSource.map(row => row[yField.fid]);
        if (xField.semanticType === 'quantitative' && yField.semanticType === 'quantitative') {
            score = mic(X, Y);
        }
        if (xField.semanticType !== 'quantitative' && yField.semanticType === 'quantitative') {
            if (xField.semanticType === 'temporal')score = pureGeneralMic(X, Y)
            else score = generalMic(X, Y)
        }
        if (xField.semanticType === 'quantitative' && yField.semanticType !== 'quantitative') {
            if (yField.semanticType === 'temporal') score = inverseGeneralMic(X, Y, getTemporalFreqRange)
            else score = inverseGeneralMic(X, Y)
        }
        if (xField.semanticType !== 'quantitative' && yField.semanticType !== 'quantitative') {
            if (yField.semanticType === 'temporal') score = nnMic(X, Y, getTemporalFreqRange)
            // 这里如果要用hack的temporal解法的话，需要用purennmic来做T-T类型。但是我们目前并不想提升T-T类型。不如等到之后时间系统改造完用正规的方法搞。
            else score = nnMic(X, Y)
        }
        // totalScore += score * filteredDataSource.length / dataSource.length;
        totalScore = Math.min(score, totalScore)
    }
    // eslint-disable-next-line no-constant-condition
    if (true) {
        const cond = new Set(uniqueCondValues.slice(0, -1));
        const filteredDataSource = dataSource.filter(row => !cond.has(row[condField.fid]));
        if (filteredDataSource.length > 40) {
            let score = 0;
            const X = filteredDataSource.map(row => row[xField.fid]);
            const Y = filteredDataSource.map(row => row[yField.fid]);
            if (xField.semanticType === 'quantitative' && yField.semanticType === 'quantitative') {
                score = mic(X, Y);
            }
            if (xField.semanticType !== 'quantitative' && yField.semanticType === 'quantitative') {
                if (xField.semanticType === 'temporal')score = pureGeneralMic(X, Y)
                else score = generalMic(X, Y)
            }
            if (xField.semanticType === 'quantitative' && yField.semanticType !== 'quantitative') {
                if (yField.semanticType === 'temporal') score = inverseGeneralMic(X, Y, getTemporalFreqRange)
                else score = inverseGeneralMic(X, Y)
            }
            if (xField.semanticType !== 'quantitative' && yField.semanticType !== 'quantitative') {
                if (yField.semanticType === 'temporal') score = nnMic(X, Y, getTemporalFreqRange)
                // 这里如果要用hack的temporal解法的话，需要用purennmic来做T-T类型。但是我们目前并不想提升T-T类型。不如等到之后时间系统改造完用正规的方法搞。
                else score = nnMic(X, Y)
            }
            // totalScore += score * filteredDataSource.length / dataSource.length;
            totalScore = Math.min(score, totalScore)
        }
    }

    return totalScore;
}

export function getFieldRelationCheckedMatrix (mat: number[][], fields: IFieldMeta[], dataSource: IRow[]) {
    let ans: number[][] = new Array(mat.length).fill(0).map(() => new Array(mat.length).fill(0));
    for (let i = 0; i < mat.length; i++) {
        for (let j = 0; j < mat[i].length; j++) {
            for (let k = 0; k < fields.length; k++) {
                ans[i][j] = mat[i][j]
                if (i === j || i === k || j === k) continue;
                const score1 = conditionaExtremelMic(fields[k], fields[i], fields[j], dataSource);
                if (score1 < 0.05) {
                    ans[i][j] = 0;
                    break;
                }
                ans[i][j] = Math.max(ans[i][j], score1)
                // ans[i][j] = ans[j][i] = Math.min(ans[i][j], ans[j][i], score1, score2);
                // if (Math.abs(score) < Math.abs(ans[i][j])) {
                //     ans[i][j] = score;
                // }
                // ans[i][j] = Math.min(ans[i][j], score1);
                // if ((mat[i][j] > 0.5 || mat[j][i] > 0.5) && mat[k][i] > 0.5 && mat[k][j] > 0.5) {
                //     const score = conditionalMic(fields[k], fields[i], fields[j], dataSource);
                //     ans[i][j] = ans[j][i] = Math.max(score, ans[i][j], ans[j][i]);
                //     // if (Math.max(mat[i][j], mat[j][i]) - score > 0.1) {
                //     //     mat[i][j] = mat[j][i] = score;
                //     // }
                // }
            }
        }
    }
    for (let i = 0 ; i < ans.length; i++) {
        for (let j = 0; j < ans.length; j++) {
            if (ans[i][j] > 0 && ans[j][i] > 0) {
                if (ans[i][j] - ans[j][i] > 0.2) {
                    ans[j][i] = 0
                } else if (ans[j][i] - ans[i][j] > 0.2) {
                    ans[i][j] = 0
                }
            }
        }
    }
    return ans;
}

export function encodeDiscrete (dataSource: IRow[], fields: IFieldMeta[]): IRow[] {
    const ans: IRow[] = [];
    const lookup: Map<string, Map<any, number>> = new Map();
    for (let field of fields) {
        if (field.semanticType !== 'nominal') continue;
        const map = new Map();
        for (let i = 0; i < field.distribution.length; i++) {
            map.set(field.distribution[i].memberName, i);
        }
        lookup.set(field.fid, map);
    }
    for (let row of dataSource) {
        const newRow: IRow = {};
        for (let field of fields) {
            if (field.semanticType === 'temporal') {
                newRow[field.fid] = dayjs(row[field.fid]).valueOf();
            } else if (field.semanticType !== 'nominal') {
                newRow[field.fid] = row[field.fid];
            } else {
                newRow[field.fid] = lookup.get(field.fid)!.get(row[field.fid]);
            }
        }
        ans.push(newRow);
    }
    return ans;
}

export function skeletonPC (mat: number[][], alpha: number): number[][] {
    const ans: number[][] = new Array(mat.length).fill(0).map(() => new Array(mat.length).fill(0));
    for (let i = 0; i < mat.length; i++) {
        for (let j = 0; j < mat[i].length; j++) {
            if (mat[i][j] > alpha) {
                ans[i][j] = 1;
            }
        }
    }
    return ans;
}

export function extendCPDAG (mat: number[][], O: Map<number, number[]>) {
    const ans: number[][] = new Array(mat.length).fill(0).map(() => new Array(mat.length).fill(0));
    for (let i = 0; i < mat.length; i++) {
        for (let j = 0; j < mat[i].length; j++) {
            ans[i][j] = mat[i][j];
        }
    }
    for (let [, value] of O) {
        for (let i = 0; i < value.length; i++) {
            for (let j = 0; j < value.length; j++) {
                if (i === j) continue;
                ans[value[i]][value[j]] = 1;
            }
        }
    }
    return ans;
}
