import { notify } from '../../../components/error';
import type { IRow } from '../../../interfaces';
import { workerService } from '../../../services';
import { getGlobalStore } from '../../../store';
import type { CausalServiceMode, IFunctionalDep } from '../config';
import type { FunctionalDependencyDetectionRequest } from './local';
import FunctionalDependenciesWorker from './functionalDependencies.worker?worker';

const AutoDetectionApiPath = 'causal/FuncDepTest';

async function getGeneratedFDFromServer(dataSource: readonly IRow[]): Promise<IFunctionalDep[]> {
    const { causalStore } = getGlobalStore();
    const { causalServer } = causalStore.operator;
    const { allFields, fields } = causalStore.dataset;
    const res = await fetch(`${causalServer}/${AutoDetectionApiPath}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            dataSource,
            fields: allFields,
            focusedFields: fields.map((f) => f.fid),
            bgKnowledgesPag: [],
            funcDeps: [],
            params: {
                alpha: -3.3010299956639813,
                catEncodeType: 'topk-with-noise',
                indep_test: 'chisq',
                o_alpha: 3,
                orient: 'ANM',
                quantEncodeType: 'bin',
            },
        }),
    });
    const result = await res.json();
    if (!result.success) {
        throw new Error(result.message);
    }

    const matrix = result.data.matrix as number[][];
    const deps: IFunctionalDep[] = [];
    for (let targetIndex = 0; targetIndex < matrix.length; targetIndex += 1) {
        const params: IFunctionalDep['params'] = [];
        for (let sourceIndex = 0; sourceIndex < matrix.length; sourceIndex += 1) {
            if (sourceIndex === targetIndex || matrix[sourceIndex][targetIndex] !== 1 || matrix[targetIndex][sourceIndex] !== -1) {
                continue;
            }
            params.push({ fid: fields[sourceIndex].fid, type: 'FuncDepTest' });
        }
        if (params.length > 0) {
            deps.push({
                fid: fields[targetIndex].fid,
                params,
            });
        }
    }
    return deps;
}

async function getGeneratedFDFromWorker(dataSource: readonly IRow[]): Promise<IFunctionalDep[]> {
    const { causalStore } = getGlobalStore();
    const { fields } = causalStore.dataset;
    const worker = new FunctionalDependenciesWorker();
    try {
        const request: FunctionalDependencyDetectionRequest = {
            dataSource: dataSource.map((row) => ({ ...row })),
            fields: fields.map((field) => ({
                fid: field.fid,
                name: field.name,
                semanticType: field.semanticType,
            })),
        };
        const result = await workerService<IFunctionalDep[], FunctionalDependencyDetectionRequest>(worker, request);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    } finally {
        worker.terminate();
    }
}

export const getGeneratedFDFromAutoDetection = async (
    dataSource: readonly IRow[],
    serviceMode: CausalServiceMode = 'worker'
): Promise<IFunctionalDep[]> => {
    try {
        return serviceMode === 'server' ? await getGeneratedFDFromServer(dataSource) : await getGeneratedFDFromWorker(dataSource);
    } catch (error) {
        notify({
            title: 'Causal Preconditions Auto Detection Error',
            type: 'error',
            content: `${error}`,
        });
        return [];
    }
};
