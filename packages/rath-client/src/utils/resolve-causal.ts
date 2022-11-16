import intl from 'react-intl-universal';


export enum CausalLinkDirection {
    none = 0,
    directed = 1,
    reversed = -1,
    weakDirected = 2,
    weakReversed = -2,
    undirected = 3,
    bidirected = 4,
}

const CausalLinkDirectionNames: Record<CausalLinkDirection, string> = {
    [CausalLinkDirection.none]: intl.get('causal_direction.none'),
    [CausalLinkDirection.directed]: intl.get('causal_direction.directed'),
    [CausalLinkDirection.reversed]: intl.get('causal_direction.reversed'),
    [CausalLinkDirection.weakDirected]: intl.get('causal_direction.weakDirected'),
    [CausalLinkDirection.weakReversed]: intl.get('causal_direction.weakReversed'),
    [CausalLinkDirection.undirected]: intl.get('causal_direction.undirected'),
    [CausalLinkDirection.bidirected]: intl.get('causal_direction.bidirected'),
};

const CausalLinkDirectionDesc: Record<CausalLinkDirection, string> = {
    [CausalLinkDirection.none]: intl.get('causal_direction_desc.none'),
    [CausalLinkDirection.directed]: intl.get('causal_direction_desc.directed'),
    [CausalLinkDirection.reversed]: intl.get('causal_direction_desc.reversed'),
    [CausalLinkDirection.weakDirected]: intl.get('causal_direction_desc.weakDirected'),
    [CausalLinkDirection.weakReversed]: intl.get('causal_direction_desc.weakReversed'),
    [CausalLinkDirection.undirected]: intl.get('causal_direction_desc.undirected'),
    [CausalLinkDirection.bidirected]: intl.get('causal_direction_desc.bidirected'),
};

export const stringifyDirection = (value: CausalLinkDirection): string => {
    return CausalLinkDirectionNames[value];
};

export const describeDirection = (value: CausalLinkDirection): string => {
    return CausalLinkDirectionDesc[value];
};

const resolveCausal = (resultMatrix: readonly (readonly number[])[], causalAlgorithm: string): CausalLinkDirection[][] => {
    const matrix: CausalLinkDirection[][] = resultMatrix.map(row => row.map(() => CausalLinkDirection.none));

    /* eslint no-fallthrough: ["error", { "allowEmptyCase": true }] */
    switch (causalAlgorithm) {
        case 'CD_NOD':
        case 'PC': {
            // cg.G.graph[j,i]=1 and cg.G.graph[i,j]=-1 indicate i –> j;
            // cg.G.graph[i,j] = cg.G.graph[j,i] = -1 indicate i — j;
            // cg.G.graph[i,j] = cg.G.graph[j,i] = 1 indicates i <-> j.
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
                    }
                }
            }
            break;
        }
        case 'FCI': {
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
            break;
        }
        case 'GES': {
            // Record[‘G’].graph[j,i]=1 and Record[‘G’].graph[i,j]=-1 indicate i –> j;
            // Record[‘G’].graph[i,j] = Record[‘G’].graph[j,i] = -1 indicates i — j.
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
                    }
                }
            }
            break;
        }
        case 'ExactSearch': {
            // Estimated DAG.
            for (let i = 0; i < resultMatrix.length; i += 1) {
                for (let j = 0; j < resultMatrix.length; j += 1) {
                    if (i === j) {
                        continue;
                    }
                    if (resultMatrix[i][j] === 1) {
                        matrix[i][j] = CausalLinkDirection.directed;
                        matrix[j][i] = CausalLinkDirection.reversed;
                    }
                }
            }
            break;
        }
        default: {
            console.warn(`Unknown algo: ${causalAlgorithm}`);
            break;
        }
    }

    return matrix;
};


export default resolveCausal;
