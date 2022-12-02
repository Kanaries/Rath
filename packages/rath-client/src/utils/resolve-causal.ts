/** @deprecated */

import intl from 'react-intl-universal';
import type { IFieldMeta } from '../interfaces';
import { BgKnowledgePagLink, ModifiableBgKnowledge, PagLink, PAG_NODE } from '../pages/causal/config';


export enum CausalLinkDirection {
    none = 0,
    directed = 1,
    reversed = -1,
    weakDirected = 2,
    weakReversed = -2,
    undirected = 3,
    weakUndirected = -3,
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
        [CausalLinkDirection.weakUndirected]: intl.get('causal_direction.weakUndirected'),
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
        [CausalLinkDirection.weakUndirected]: intl.get('causal_direction_desc.weakUndirected'),
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
            } else if (backwardFlag === 2 && forwardFlag === 2) {
                matrix[i][j] = CausalLinkDirection.weakUndirected;
                matrix[j][i] = CausalLinkDirection.weakUndirected;
            }
        }
    }

    return matrix;
};

export const mergeCausalPag = (
    resultMatrix: readonly (readonly CausalLinkDirection[])[],
    conditions: readonly ModifiableBgKnowledge[],
    fields: readonly IFieldMeta[],
): PagLink[] => {
    const links: PagLink[] = [];

    for (let i = 0; i < resultMatrix.length - 1; i += 1) {
        for (let j = i + 1; j < resultMatrix.length; j += 1) {
            const flag = resultMatrix[i][j];
            switch (flag) {
                case CausalLinkDirection.directed: {
                    links.push({
                        src: fields[i].fid,
                        src_type: PAG_NODE.BLANK,
                        tar: fields[j].fid,
                        tar_type: PAG_NODE.ARROW,
                    });
                    break;
                }
                case CausalLinkDirection.reversed: {
                    links.push({
                        src: fields[i].fid,
                        src_type: PAG_NODE.ARROW,
                        tar: fields[j].fid,
                        tar_type: PAG_NODE.BLANK,
                    });
                    break;
                }
                case CausalLinkDirection.undirected: {
                    links.push({
                        src: fields[i].fid,
                        src_type: PAG_NODE.BLANK,
                        tar: fields[j].fid,
                        tar_type: PAG_NODE.BLANK,
                    });
                    break;
                }
                case CausalLinkDirection.bidirected: {
                    links.push({
                        src: fields[i].fid,
                        src_type: PAG_NODE.ARROW,
                        tar: fields[j].fid,
                        tar_type: PAG_NODE.ARROW,
                    });
                    break;
                }
                case CausalLinkDirection.weakDirected: {
                    links.push({
                        src: fields[i].fid,
                        src_type: PAG_NODE.CIRCLE,
                        tar: fields[j].fid,
                        tar_type: PAG_NODE.ARROW,
                    });
                    break;
                }
                case CausalLinkDirection.weakReversed: {
                    links.push({
                        src: fields[i].fid,
                        src_type: PAG_NODE.ARROW,
                        tar: fields[j].fid,
                        tar_type: PAG_NODE.CIRCLE,
                    });
                    break;
                }
                case CausalLinkDirection.weakUndirected: {
                    links.push({
                        src: fields[i].fid,
                        src_type: PAG_NODE.CIRCLE,
                        tar: fields[j].fid,
                        tar_type: PAG_NODE.CIRCLE,
                    });
                    break;
                }
                default: {
                    break;
                }
            }
        }
    }

    const merge = (edge: PagLink) => {
        const overloadIdx = links.findIndex(link => [link.src, link.tar].every(fid => [edge.src, edge.tar].includes(fid)));
        if (overloadIdx === -1) {
            links.push(edge);
        } else {
            links.splice(overloadIdx, 1, edge);
        }
    };

    for (const edge of conditions) {
        switch (edge.type) {
            case 'must-link': {
                merge({
                    src: edge.src,
                    tar: edge.tar,
                    src_type: PAG_NODE.CIRCLE,
                    tar_type: PAG_NODE.CIRCLE,
                });
                break;
            }
            case 'must-not-link': {
                merge({
                    src: edge.src,
                    tar: edge.tar,
                    src_type: PAG_NODE.EMPTY,
                    tar_type: PAG_NODE.EMPTY,
                });
                break;
            }
            case 'directed-must-link': {
                merge({
                    src: edge.src,
                    tar: edge.tar,
                    src_type: PAG_NODE.BLANK,
                    tar_type: PAG_NODE.ARROW,
                });
                break;
            }
            case 'directed-must-not-link': {
                merge({
                    src: edge.src,
                    tar: edge.tar,
                    src_type: PAG_NODE.EMPTY,
                    tar_type: PAG_NODE.ARROW,
                });
                break;
            }
            default: {
                break;
            }
        }
    }

    return links;
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
                default: {
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
    expected: CausalLinkDirection | { not: CausalLinkDirection } | { oneOf: CausalLinkDirection[] };
    received: CausalLinkDirection;
}

export const findUnmatchedCausalResults = (
    fields: readonly IFieldMeta[],
    preconditions: readonly Readonly<BgKnowledgePagLink>[],
    causalMatrix: readonly (readonly CausalLinkDirection[])[]
): Readonly<ICausalDiff>[] => {
    const diffs: ICausalDiff[] = [];

    for (const precondition of preconditions) {
        const srcIdx = fields.findIndex(f => f.fid === precondition.src);
        const tarIdx = fields.findIndex(f => f.fid === precondition.tar);
        if (srcIdx === -1 || tarIdx === -1) {
            continue;
        }
        const result = causalMatrix[srcIdx][tarIdx];
        switch (`${precondition.src_type},${precondition.tar_type}`) {
            case `${PAG_NODE.CIRCLE},${PAG_NODE.CIRCLE}`: {
                // must-link
                if (result === CausalLinkDirection.none) {
                    diffs.push({
                        srcFid: fields[srcIdx].fid,
                        tarFid: fields[tarIdx].fid,
                        expected: { not: CausalLinkDirection.none },
                        received: result,
                    });
                }
                break;
            }
            case `${PAG_NODE.EMPTY},${PAG_NODE.EMPTY}`: {
                // must-not-link
                if (result !== CausalLinkDirection.none) {
                    diffs.push({
                        srcFid: fields[srcIdx].fid,
                        tarFid: fields[tarIdx].fid,
                        expected: CausalLinkDirection.none,
                        received: result,
                    });
                }
                break;
            }
            case `${PAG_NODE.BLANK},${PAG_NODE.ARROW}`: {
                // directed-must-link
                const expected = [
                    CausalLinkDirection.directed,
                    CausalLinkDirection.undirected,
                    CausalLinkDirection.bidirected,
                    CausalLinkDirection.weakDirected,
                ];
                if (!expected.includes(result)) {
                    diffs.push({
                        srcFid: fields[srcIdx].fid,
                        tarFid: fields[tarIdx].fid,
                        expected: { oneOf: expected },
                        received: result,
                    });
                }
                break;
            }
            case `${PAG_NODE.EMPTY},${PAG_NODE.ARROW}`: {
                // directed-must-not-link
                const expected = [
                    CausalLinkDirection.none,
                    CausalLinkDirection.reversed,
                    CausalLinkDirection.weakReversed,
                ];
                if (!expected.includes(result)) {
                    diffs.push({
                        srcFid: fields[srcIdx].fid,
                        tarFid: fields[tarIdx].fid,
                        expected: { oneOf: expected },
                        received: result,
                    });
                }
                break;
            }
            default: {
                break;
            }
        }
    }

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
                    if (nextMatrix[j][i] !== prevMatrix[j][i]) {
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

export const transformPreconditions = (preconditions: ModifiableBgKnowledge[], fields: IFieldMeta[]): PagLink[] => {
    return preconditions.reduce<PagLink[]>((list, decl) => {
        const srcIdx = fields.findIndex((f) => f.fid === decl.src);
        const tarIdx = fields.findIndex((f) => f.fid === decl.tar);

        if (srcIdx !== -1 && tarIdx !== -1) {
            switch (decl.type) {
                case 'must-link': {
                    list.push({
                        src: decl.src,
                        tar: decl.tar,
                        src_type: PAG_NODE.CIRCLE,
                        tar_type: PAG_NODE.CIRCLE,
                    });
                    break;
                }
                case 'must-not-link': {
                    list.push({
                        src: decl.src,
                        tar: decl.tar,
                        src_type: PAG_NODE.EMPTY,
                        tar_type: PAG_NODE.EMPTY,
                    });
                    break;
                }
                case 'directed-must-link': {
                    list.push({
                        src: decl.src,
                        tar: decl.tar,
                        src_type: PAG_NODE.BLANK,
                        tar_type: PAG_NODE.ARROW,
                    });
                    break;
                }
                case 'directed-must-not-link': {
                    list.push({
                        src: decl.src,
                        tar: decl.tar,
                        src_type: PAG_NODE.EMPTY,
                        tar_type: PAG_NODE.ARROW,
                    });
                    break;
                }
                default: {
                    break;
                }
            }
        }

        return list;
    }, []);
};


export default resolveCausal;
