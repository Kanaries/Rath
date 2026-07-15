/* eslint no-restricted-globals: 0 */
import {
    BDeuScore,
    BackgroundKnowledge,
    CausalGraph,
    ChiSquareTest,
    DenseMatrix,
    FisherZTest,
    GSquareTest,
    GaussianBicScore,
    camuv,
    cdnod,
    exactSearch,
    executeSerializablePcTask,
    fci,
    ges,
    gin,
    grasp,
    rcd,
} from '@kanaries/causal';
import type { NumericMatrix } from '@kanaries/causal';
import type { IRow } from '../../interfaces';
import type { PagLink } from './config';
import { encodeTopKWithNoise, expandFocusedFields, isNominalField, toNumericValue, transformDataSource, type DiscoveryParams } from './dataTransform';
import type { CausalDiscoveryField, CausalDiscoveryRequest, CausalDiscoveryResult } from './discoveryTypes';
import { xLearner } from './xLearner';

function expandFieldIds(fieldIds: readonly string[], sourceFieldId: string): string[] {
    const matches = fieldIds.filter((fieldId) => fieldId === sourceFieldId || (fieldId.startsWith(`${sourceFieldId}.[`) && fieldId.endsWith(']')));
    return matches.length > 0 ? matches : [sourceFieldId];
}

function buildBackgroundKnowledge(bgKnowledgesPag: readonly PagLink[], focusedFields: readonly string[]): BackgroundKnowledge | undefined {
    if (bgKnowledgesPag.length === 0) {
        return undefined;
    }
    const focused = new Set(focusedFields);
    const knowledge = new BackgroundKnowledge();
    let hasRule = false;

    for (const link of bgKnowledgesPag) {
        const sourceMatches = expandFieldIds(focusedFields, link.src).filter((fieldId) => focused.has(fieldId));
        const targetMatches = expandFieldIds(focusedFields, link.tar).filter((fieldId) => focused.has(fieldId));
        if (sourceMatches.length === 0 || targetMatches.length === 0) {
            continue;
        }

        for (const sourceField of sourceMatches) {
            for (const targetField of targetMatches) {
                if (sourceField === targetField) {
                    continue;
                }
                if (link.src_type === -1 && link.tar_type === 1) {
                    knowledge.addRequired(sourceField, targetField);
                    hasRule = true;
                } else if (link.src_type === 1 && link.tar_type === -1) {
                    knowledge.addRequired(targetField, sourceField);
                    hasRule = true;
                }
                if (link.src_type === 0) {
                    knowledge.addForbidden(sourceField, targetField);
                    hasRule = true;
                }
                if (link.tar_type === 0) {
                    knowledge.addForbidden(targetField, sourceField);
                    hasRule = true;
                }
            }
        }
    }

    return hasRule ? knowledge : undefined;
}

function buildExactSearchKnowledge(
    bgKnowledgesPag: readonly PagLink[],
    focusedFields: readonly string[]
): { superGraph?: number[][]; includeGraph?: number[][] } {
    if (bgKnowledgesPag.length === 0) {
        return {};
    }
    const indexByField = new Map(focusedFields.map((fid, index) => [fid, index]));
    const size = focusedFields.length;
    const superGraph = Array.from({ length: size }, (_, rowIndex) =>
        Array.from({ length: size }, (_, columnIndex) => (rowIndex === columnIndex ? 0 : 1))
    );
    const includeGraph = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
    let hasRule = false;

    for (const link of bgKnowledgesPag) {
        const sourceMatches = expandFieldIds(focusedFields, link.src);
        const targetMatches = expandFieldIds(focusedFields, link.tar);

        for (const sourceField of sourceMatches) {
            for (const targetField of targetMatches) {
                const sourceIndex = indexByField.get(sourceField);
                const targetIndex = indexByField.get(targetField);
                if (sourceIndex === undefined || targetIndex === undefined || sourceIndex === targetIndex) {
                    continue;
                }
                if (link.src_type === 0) {
                    superGraph[sourceIndex][targetIndex] = 0;
                    hasRule = true;
                }
                if (link.tar_type === 0) {
                    superGraph[targetIndex][sourceIndex] = 0;
                    hasRule = true;
                }
                if (link.src_type === -1 && link.tar_type === 1) {
                    includeGraph[sourceIndex][targetIndex] = 1;
                    hasRule = true;
                }
                if (link.src_type === 1 && link.tar_type === -1) {
                    includeGraph[targetIndex][sourceIndex] = 1;
                    hasRule = true;
                }
            }
        }
    }

    return hasRule ? { superGraph, includeGraph } : {};
}

function expandFunctionalDependencies(
    fields: readonly Pick<CausalDiscoveryField, 'fid'>[],
    funcDeps: CausalDiscoveryRequest['funcDeps']
): CausalDiscoveryRequest['funcDeps'] {
    const fieldIds = fields.map((field) => field.fid);
    const deduped = new Map<string, CausalDiscoveryRequest['funcDeps'][number]>();

    for (const funcDep of funcDeps) {
        const targetFieldIds = expandFieldIds(fieldIds, funcDep.fid);
        for (const param of funcDep.params) {
            const sourceFieldIds = expandFieldIds(fieldIds, param.fid);
            for (const sourceFieldId of sourceFieldIds) {
                for (const targetFieldId of targetFieldIds) {
                    if (sourceFieldId === targetFieldId) {
                        continue;
                    }
                    const key = `${sourceFieldId}->${targetFieldId}`;
                    deduped.set(key, {
                        fid: targetFieldId,
                        params: [{ fid: sourceFieldId, type: param.type }],
                        func: funcDep.func,
                    });
                }
            }
        }
    }

    return [...deduped.values()];
}

function graphToMatrix(shape: Parameters<typeof CausalGraph.fromShape>[0]): number[][] {
    return CausalGraph.fromShape(shape).getAdjacencyMatrix();
}

function createCiTest(kind: string, data: NumericMatrix) {
    switch (kind) {
        case 'fisherz':
            return new FisherZTest(data);
        case 'chisq':
            return new ChiSquareTest(data);
        case 'gsq':
            return new GSquareTest(data);
        default:
            throw new Error(`Unsupported independence test: ${kind}`);
    }
}

function createScore(kind: string, data: DenseMatrix) {
    switch (kind) {
        case 'local_score_BIC':
            return new GaussianBicScore(data);
        case 'local_score_BDeu':
            return new BDeuScore(data);
        default:
            throw new Error(`Unsupported score function: ${kind}`);
    }
}

function pickField(fields: readonly CausalDiscoveryField[], fid: string): CausalDiscoveryField {
    const field = fields.find((item) => item.fid === fid);
    if (!field) {
        throw new Error(`Unknown field: ${fid}`);
    }
    return field;
}

function buildContextValues(
    dataSource: readonly IRow[],
    fields: readonly CausalDiscoveryField[],
    cIndx: string
): { values: number[]; label: string } {
    if (cIndx === '$id') {
        return {
            values: dataSource.map((_, index) => index),
            label: '$id',
        };
    }
    const field = pickField(fields, cIndx);
    const values = dataSource.map((row) => row[cIndx]);
    if (isNominalField(field)) {
        return {
            values: encodeTopKWithNoise(values),
            label: field.fid,
        };
    }
    return {
        values: values.map(toNumericValue),
        label: field.fid,
    };
}

function executeAlgorithm(request: CausalDiscoveryRequest): CausalDiscoveryResult {
    const allFieldMap = new Map(request.fields.map((field) => [field.fid, field]));
    const inputFields = request.focusedFields.map((fid) => {
        const field = allFieldMap.get(fid);
        if (!field) {
            throw new Error(`Unknown focused field: ${fid}`);
        }
        return field;
    });
    const params = request.params as DiscoveryParams;

    if (request.algorithm === 'CD_NOD') {
        const contextFieldId = params.c_indx ?? '$id';
        const observedFieldIds = request.focusedFields.filter((fid) => fid !== contextFieldId);
        const observedFields = observedFieldIds.map((fid) => pickField(request.fields, fid));
        const transformed = transformDataSource(request.dataSource, observedFields, params);
        const { values: contextValues, label: contextLabel } = buildContextValues(request.dataSource, request.fields, contextFieldId);
        const backgroundKnowledge = buildBackgroundKnowledge(request.bgKnowledgesPag, [...observedFields.map((field) => field.fid), contextLabel]);

        const result = cdnod({
            data: transformed.data,
            context: contextValues,
            createCiTest: (data) => createCiTest('fisherz', data),
            nodeLabels: transformed.fields.map((field) => field.fid),
            contextLabel,
            alpha: params.alpha,
            stable: params.stable,
            ucRule: params.uc_rule,
            ucPriority: params.uc_priority,
            ...(backgroundKnowledge ? { backgroundKnowledge } : {}),
        });

        return {
            matrix: graphToMatrix(result.graph),
            fields: [...transformed.fields, { fid: contextLabel, name: contextLabel, semanticType: 'ordinal' }],
        };
    }

    const transformedAll = transformDataSource(request.dataSource, inputFields, params);
    const transformedFocusIds = expandFocusedFields(transformedAll.fields, request.focusedFields);
    const focusIndexSet = new Set(transformedFocusIds);
    const focusedFields = transformedAll.fields.filter((field) => focusIndexSet.has(field.fid));
    const focusedData = new DenseMatrix(
        transformedAll.data.toArray().map((row) =>
            transformedAll.fields
                .map((field, index) => ({ field, index }))
                .filter(({ field }) => focusIndexSet.has(field.fid))
                .map(({ index }) => row[index] ?? Number.NaN)
        )
    );
    const nodeLabels = focusedFields.map((field) => field.fid);

    if (request.algorithm === 'PC') {
        const backgroundKnowledge = buildBackgroundKnowledge(request.bgKnowledgesPag, nodeLabels);
        const result = executeSerializablePcTask({
            data: focusedData.toArray(),
            ciTest: {
                kind: params.indep_test === 'fisherz' ? 'fisher-z' : params.indep_test === 'gsq' ? 'g-square' : 'chi-square',
            },
            alpha: params.alpha,
            stable: params.stable,
            ucRule: params.uc_rule,
            ucPriority: params.uc_priority,
            nodeLabels,
            ...(backgroundKnowledge ? { backgroundKnowledge: backgroundKnowledge.toShape() } : {}),
        });

        return {
            matrix: graphToMatrix(result.graph),
            fields: focusedFields,
        };
    }

    if (request.algorithm === 'FCI') {
        const backgroundKnowledge = buildBackgroundKnowledge(request.bgKnowledgesPag, nodeLabels);
        const result = fci({
            data: focusedData,
            ciTest: createCiTest(params.indep_test ?? 'fisherz', focusedData),
            nodeLabels,
            alpha: params.alpha,
            depth: params.depth,
            maxPathLength: params.max_path_length,
            ...(backgroundKnowledge ? { backgroundKnowledge } : {}),
        });

        return {
            matrix: graphToMatrix(result.graph),
            fields: focusedFields,
            extra: {
                maxDepth: result.maxDepth,
                testsRun: result.testsRun,
                sepsets: result.sepsets,
            },
        };
    }

    if (request.algorithm === 'XLearner') {
        const backgroundKnowledge = buildBackgroundKnowledge(request.bgKnowledgesPag, nodeLabels);
        const expandedFuncDeps = expandFunctionalDependencies(focusedFields, request.funcDeps);
        const result = xLearner({
            data: focusedData,
            ciTest: createCiTest(params.indep_test ?? 'gsq', focusedData),
            nodeLabels,
            alpha: params.alpha,
            depth: params.depth,
            maxPathLength: params.max_path_length,
            ...(backgroundKnowledge ? { backgroundKnowledge } : {}),
            functionalDependencies: expandedFuncDeps,
        });

        return {
            matrix: graphToMatrix(result.graph),
            fields: focusedFields,
            extra: {
                maxDepth: result.maxDepth,
                testsRun: result.testsRun,
                sepsets: result.sepsets,
            },
        };
    }

    if (request.algorithm === 'GES') {
        const result = ges({
            data: focusedData,
            score: createScore(params.score_func ?? 'local_score_BIC', focusedData),
            nodeLabels,
            ...(params.maxP ? { maxParents: params.maxP } : {}),
        });
        return {
            matrix: graphToMatrix(result.cpdag),
            origMatrix: graphToMatrix(result.dag),
            fields: focusedFields,
        };
    }

    if (request.algorithm === 'ExactSearch') {
        const knowledge = buildExactSearchKnowledge(request.bgKnowledgesPag, nodeLabels);
        const result = exactSearch({
            data: focusedData,
            score: new GaussianBicScore(focusedData),
            nodeLabels,
            searchMethod: params.search_method ?? 'astar',
            usePathExtension: params.use_path_extension,
            useKCycleHeuristic: params.use_k_cycle_heuristic,
            ...(params.maxP ? { maxParents: params.maxP } : {}),
            ...knowledge,
        });
        return {
            matrix: graphToMatrix(result.cpdag),
            origMatrix: graphToMatrix(result.dag),
            fields: focusedFields,
        };
    }

    if (request.algorithm === 'GIN') {
        const result = gin({
            data: focusedData,
            nodeLabels,
            alpha: params.alpha,
            indepTestMethod: params.indep_test_method ?? 'kci',
        });
        return {
            matrix: graphToMatrix(result.graph),
            fields: focusedFields,
            extra: {
                causalOrder: result.causalOrder,
                remainingClusters: result.remainingClusters,
            },
        };
    }

    if (request.algorithm === 'GRaSP') {
        const result = grasp({
            data: focusedData,
            score: new GaussianBicScore(focusedData),
            nodeLabels,
            depth: params.depth,
        });
        return {
            matrix: graphToMatrix(result.cpdag),
            origMatrix: graphToMatrix(result.dag),
            fields: focusedFields,
        };
    }

    if (request.algorithm === 'CAM_UV') {
        const result = camuv({
            data: focusedData,
            nodeLabels,
            alpha: params.alpha,
            ...(params.num_explanatory_vals ? { maxExplanatoryVars: params.num_explanatory_vals } : {}),
        });
        return {
            matrix: graphToMatrix(result.graph),
            fields: focusedFields,
            extra: {
                parents: result.parents,
                confoundedPairs: result.confoundedPairs,
            },
        };
    }

    if (request.algorithm === 'RCD') {
        const result = rcd({
            data: focusedData,
            nodeLabels,
            maxExplanatoryNum: params.max_explanatory_num,
            corAlpha: params.cor_alpha,
            indAlpha: params.ind_alpha,
            shapiroAlpha: params.shapiro_alpha,
            mlhsicr: params.MLHSICR,
            bwMethod: params.bw_method,
        });
        return {
            matrix: graphToMatrix(result.graph),
            origMatrix: result.adjacencyMatrix,
            fields: focusedFields,
            extra: {
                parents: result.parents,
                ancestors: result.ancestors,
                confoundedPairs: result.confoundedPairs,
            },
        };
    }

    throw new Error(`Unsupported causal discovery algorithm: ${request.algorithm}`);
}

self.addEventListener('message', (event: MessageEvent<CausalDiscoveryRequest>) => {
    try {
        const result = executeAlgorithm(event.data);
        self.postMessage({
            success: true,
            data: result,
        });
    } catch (error) {
        self.postMessage({
            success: false,
            message: error instanceof Error ? error.message : String(error),
        });
    }
});
