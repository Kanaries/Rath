import intl from 'react-intl-universal';
import type { IFieldMeta } from '../interfaces';
import type { ModifiableBgKnowledge } from '../pages/causal/config';


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


export default resolveCausal;
