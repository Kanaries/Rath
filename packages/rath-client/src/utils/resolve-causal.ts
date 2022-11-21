import intl from 'react-intl-universal';
import type { IFieldMeta } from '../interfaces';
import type { BgKnowledge, ModifiableBgKnowledge } from '../pages/causal/config';


export enum CausalLinkDirection {
    none = 0,
    directed = 1,
    reversed = -1,
    weakDirected = 2,
    weakReversed = -2,
    undirected = 3,
    bidirected = 4,
}

export const stringifyDirection = (value: CausalLinkDirection): string => {
    return {
        [CausalLinkDirection.none]: intl.get('causal_direction.none'),
        [CausalLinkDirection.directed]: intl.get('causal_direction.directed'),
        [CausalLinkDirection.reversed]: intl.get('causal_direction.reversed'),
        [CausalLinkDirection.weakDirected]: intl.get('causal_direction.weakDirected'),
        [CausalLinkDirection.weakReversed]: intl.get('causal_direction.weakReversed'),
        [CausalLinkDirection.undirected]: intl.get('causal_direction.undirected'),
        [CausalLinkDirection.bidirected]: intl.get('causal_direction.bidirected'),
    }[value];
};

export const describeDirection = (value: CausalLinkDirection): string => {
    return {
        [CausalLinkDirection.none]: intl.get('causal_direction_desc.none'),
        [CausalLinkDirection.directed]: intl.get('causal_direction_desc.directed'),
        [CausalLinkDirection.reversed]: intl.get('causal_direction_desc.reversed'),
        [CausalLinkDirection.weakDirected]: intl.get('causal_direction_desc.weakDirected'),
        [CausalLinkDirection.weakReversed]: intl.get('causal_direction_desc.weakReversed'),
        [CausalLinkDirection.undirected]: intl.get('causal_direction_desc.undirected'),
        [CausalLinkDirection.bidirected]: intl.get('causal_direction_desc.bidirected'),
    }[value];
};

const resolveCausal = (resultMatrix: readonly (readonly number[])[]): CausalLinkDirection[][] => {
    const matrix: CausalLinkDirection[][] = resultMatrix.map(row => row.map(() => CausalLinkDirection.none));

    // G.graph[j,i]=1 and G.graph[i,j]=-1 indicates i –> j;
    // G.graph[i,j] = G.graph[j,i] = -1 indicates i — j;
    // G.graph[i,j] = G.graph[j,i] = 1 indicates i <-> j;
    // G.graph[j,i]=1 and G.graph[i,j]=2 indicates i o-> j.
    for (let i = 0; i < resultMatrix.length - 1; i += 1) {
        for (let j = i + 1; j < resultMatrix.length; j += 1) {
            const forwardFlag = resultMatrix[i][j];
            const backwardFlag = resultMatrix[j][i];
            if (backwardFlag === 1 && forwardFlag === -1) {
                matrix[i][j] = CausalLinkDirection.directed;
                matrix[j][i] = CausalLinkDirection.reversed;
            } else if (forwardFlag === 1 && backwardFlag === -1) {
                matrix[i][j] = CausalLinkDirection.reversed;
                matrix[j][i] = CausalLinkDirection.directed;
            } else if (forwardFlag === -1 && backwardFlag === -1) {
                matrix[i][j] = CausalLinkDirection.undirected;
                matrix[j][i] = CausalLinkDirection.undirected;
            } else if (forwardFlag === 1 && backwardFlag === 1) {
                matrix[i][j] = CausalLinkDirection.bidirected;
                matrix[j][i] = CausalLinkDirection.bidirected;
            } else if (backwardFlag === 1 && forwardFlag === 2) {
                matrix[i][j] = CausalLinkDirection.weakDirected;
                matrix[j][i] = CausalLinkDirection.weakReversed;
            } else if (forwardFlag === 1 && backwardFlag === 2) {
                matrix[i][j] = CausalLinkDirection.weakReversed;
                matrix[j][i] = CausalLinkDirection.weakDirected;
            }
        }
    }

    return matrix;
};

export const resolvePreconditionsFromCausal = (
    causalMatrix: readonly (readonly CausalLinkDirection[])[],
    fields: readonly IFieldMeta[],
): ModifiableBgKnowledge[] => {
    const preconditions: ModifiableBgKnowledge[] = [];

    for (let i = 0; i < causalMatrix.length - 1; i += 1) {
        for (let j = i + 1; j < causalMatrix.length; j += 1) {
            const flag = causalMatrix[i][j];
            const a = fields[i].fid;
            const b = fields[j].fid;
            switch (flag) {
                case CausalLinkDirection.directed: {
                    preconditions.push({
                        src: a,
                        tar: b,
                        type: 'directed-must-link',
                    });
                    break;
                }
                case CausalLinkDirection.reversed: {
                    preconditions.push({
                        src: b,
                        tar: a,
                        type: 'directed-must-link',
                    });
                    break;
                }
                case CausalLinkDirection.undirected:
                case CausalLinkDirection.bidirected: {
                    preconditions.push({
                        src: a,
                        tar: b,
                        type: 'must-link',
                    });
                    break;
                }
            }
        }
    }

    return preconditions;
};

export interface ICausalDiff {
    srcFid: string;
    tarFid: string;
    expected: CausalLinkDirection;
    received: CausalLinkDirection;
}

export const findUnmatchedCausalResults = (
    fields: readonly IFieldMeta[],
    preconditions: readonly Readonly<BgKnowledge>[],
    causalMatrix: readonly (readonly CausalLinkDirection[])[]
): Readonly<ICausalDiff>[] => {
    const diffs: ICausalDiff[] = [];

    // TODO:
    // for (const precondition of preconditions) {
    //     const srcIdx = fields.findIndex(f => f.fid === precondition.src);
    //     const tarIdx = fields.findIndex(f => f.fid === precondition.tar);
    //     const result = causalMatrix[srcIdx][tarIdx];
    //     switch (precondition.type) {
    //         case "directed-must-link": {
    //             if (result !== CausalLinkDirection.directed) {
    //                 diffs.push({
    //                     srcFid: precondition.src,
    //                     tarFid: precondition.tar,
    //                     expected: CausalLinkDirection.directed,
    //                     received: result,
    //                 });
    //             }
    //             break;
    //         }
    //         case "directed-must-not-link": {
    //             if (
    //                 result !== CausalLinkDirection.none &&
    //                 result !== CausalLinkDirection.reversed &&
    //                 result !== CausalLinkDirection.weakReversed
    //             ) {
    //                 diffs.push({
    //                     srcFid: precondition.src,
    //                     tarFid: precondition.tar,
    //                     expected: CausalLinkDirection.directed,
    //                     received: result,
    //                 });
    //             }
    //             break;
    //         }
    //         case "must-link": {
    //             if (result === CausalLinkDirection.none) {
    //                 diffs.push({
    //                     srcFid: precondition.src,
    //                     tarFid: precondition.tar,
    //                     expected: CausalLinkDirection.directed,
    //                     received: result,
    //                 });
    //             }
    //             break;
    //         }
    //         case "must-not-link": {
    //             if (result !== CausalLinkDirection.none) {
    //                 diffs.push({
    //                     srcFid: precondition.src,
    //                     tarFid: precondition.tar,
    //                     expected: CausalLinkDirection.directed,
    //                     received: result,
    //                 });
    //             }
    //             break;
    //         }
    //         default: {
    //             break;
    //         }
    //     }
    // }

    return diffs;
};

/**
 * 这个方法后续可以用于对比两轮不同数据子集的运行结果的颠覆型差异（不会匹配增量型差异）.
 */
export const diffCausalResults = (
    fields: readonly IFieldMeta[],
    prevMatrix: readonly (readonly CausalLinkDirection[])[],
    nextMatrix: readonly (readonly CausalLinkDirection[])[]
): Readonly<ICausalDiff>[] => {
    const diffs: ICausalDiff[] = [];
    
    for (let i = 0; i < prevMatrix.length - 1; i += 1) {
        for (let j = i + 1; j < prevMatrix.length; j += 1) {
            const prev = prevMatrix[i][j];
            const next = nextMatrix[i][j];
            switch (prev) {
                case CausalLinkDirection.none: {
                    break;
                }
                case CausalLinkDirection.reversed:
                case CausalLinkDirection.weakReversed: {
                    if (next !== prev) {
                        diffs.push({
                            srcFid: fields[j].fid,
                            tarFid: fields[i].fid,
                            expected: prevMatrix[j][i],
                            received: nextMatrix[j][i],
                        });
                    }
                    break;
                }
                default: {
                    if (next !== prev) {
                        diffs.push({
                            srcFid: fields[i].fid,
                            tarFid: fields[j].fid,
                            expected: prev,
                            received: next,
                        });
                    }
                    break;
                }
            }
        }
    }

    return diffs;
};


export default resolveCausal;
