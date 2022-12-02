import { notify } from "../../../components/error";
import type { IRow } from "../../../interfaces";
import { getGlobalStore } from "../../../store";
import { IFunctionalDep, IFunctionalDepParam, PAG_NODE } from "../config";


const AutoDetectionApiPath = 'causal/FuncDepTest';

export const getGeneratedFDFromAutoDetection = async (dataSource: readonly IRow[]): Promise<IFunctionalDep[]> => {
    try {
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
                focusedFields: fields.map(f => f.fid),
                bgKnowledgesPag: [],
                funcDeps: [],
                params: {
                    alpha: -3.3010299956639813,
                    catEncodeType: "topk-with-noise",
                    indep_test: "chisq",
                    o_alpha: 3,
                    orient: "ANM",
                    quantEncodeType: "bin"
                },
            }),
        });
        const result = await res.json();
        if (result.success) {
            const matrix = result.data.matrix as PAG_NODE[][];
            const deps: IFunctionalDep[] = [];
            for (let j = 0; j < matrix.length; j += 1) {
                const params: IFunctionalDepParam[] = [];
                for (let i = 0; i < matrix.length; i += 1) {
                    if (i === j || matrix[i][j] !== PAG_NODE.ARROW || matrix[j][i] !== PAG_NODE.BLANK) {
                        continue;
                    }
                    params.push({ fid: fields[i].fid, type: 'FuncDepTest' });
                }
                if (params.length > 0) {
                    deps.push({
                        fid: fields[j].fid,
                        params,
                    });
                }
            }
            return deps;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        notify({
            title: 'Causal Preconditions Auto Detection Error',
            type: 'error',
            content: `${error}`,
        });
        return [];
    }
};
