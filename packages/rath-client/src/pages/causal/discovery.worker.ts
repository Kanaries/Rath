/* eslint no-restricted-globals: 0 */
import dayjs from 'dayjs';
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
import type { CausalDiscoveryField, CausalDiscoveryRequest, CausalDiscoveryResult } from './discoveryTypes';
import { xLearner } from './xLearner';

type EncodedColumn = {
    fid: string;
    name?: string;
    semanticType: CausalDiscoveryField['semanticType'];
    values: number[];
};

type EncodedDataset = {
    data: DenseMatrix;
    fields: CausalDiscoveryField[];
};

type DiscoveryParams = {
    catEncodeType?: string;
    quantEncodeType?: string;
    indep_test?: string;
    score_func?: string;
    [key: string]: any;
};

function isNominalField(field: CausalDiscoveryField): boolean {
    return field.semanticType === 'nominal';
}

function isTemporalField(field: CausalDiscoveryField): boolean {
    return field.semanticType === 'temporal';
}

function isNumericField(field: CausalDiscoveryField): boolean {
    return field.semanticType === 'quantitative' || field.semanticType === 'ordinal';
}

function toNumericValue(value: unknown): number {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : Number.NaN;
    }
    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }
    if (typeof value === 'bigint') {
        return Number(value);
    }
    if (value instanceof Date) {
        return value.getTime() / 1000;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length === 0) {
            return Number.NaN;
        }
        const direct = Number(trimmed);
        if (Number.isFinite(direct)) {
            return direct;
        }
        const time = dayjs(trimmed);
        if (time.isValid()) {
            return time.valueOf() / 1000;
        }
    }
    if (value == null) {
        return Number.NaN;
    }
    const coerced = Number(value);
    return Number.isFinite(coerced) ? coerced : Number.NaN;
}

function stringKey(value: unknown): string {
    if (value == null) {
        return '__null__';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}

function factorize(values: readonly unknown[], sortValues = false): { codes: number[]; unique: unknown[] } {
    const unique = new Map<string, unknown>();
    for (const value of values) {
        const key = stringKey(value);
        if (!unique.has(key)) {
            unique.set(key, value);
        }
    }

    const entries = [...unique.entries()];
    if (sortValues) {
        entries.sort((left, right) => String(left[1]).localeCompare(String(right[1])));
    }

    const indexByKey = new Map(entries.map(([key], index) => [key, index]));
    return {
        codes: values.map((value) => indexByKey.get(stringKey(value)) ?? 0),
        unique: entries.map(([, value]) => value),
    };
}

function rankLexicographic(values: readonly unknown[]): number[] {
    const sorted = [...values].map((value) => String(value)).sort((left, right) => left.localeCompare(right));
    const lastRank = new Map<string, number>();
    sorted.forEach((value, index) => {
        lastRank.set(value, index + 1);
    });
    return values.map((value) => lastRank.get(String(value)) ?? 0);
}

function buildCountEntries(values: readonly unknown[]): Array<{ key: string; value: unknown; count: number; firstIndex: number }> {
    const counts = new Map<string, { value: unknown; count: number; firstIndex: number }>();
    values.forEach((value, index) => {
        const key = stringKey(value);
        const current = counts.get(key);
        if (current) {
            current.count += 1;
            return;
        }
        counts.set(key, { value, count: 1, firstIndex: index });
    });
    return [...counts.entries()]
        .map(([key, { value, count, firstIndex }]) => ({ key, value, count, firstIndex }))
        .sort((left, right) => {
            if (right.count !== left.count) {
                return right.count - left.count;
            }
            return left.firstIndex - right.firstIndex;
        });
}

function encodeTopKWithNoise(values: readonly unknown[]): number[] {
    const counts = buildCountEntries(values);
    const topK = 16;
    const codeByKey = new Map<string, number>();
    counts.forEach((entry, index) => {
        codeByKey.set(entry.key, counts.length <= topK ? index : Math.min(index, topK - 1));
    });
    return values.map((value) => codeByKey.get(stringKey(value)) ?? 0);
}

function encodeOneHotColumns(fid: string, name: string | undefined, values: readonly unknown[]): EncodedColumn[] {
    const { unique } = factorize(values);
    if (unique.length > 64) {
        throw new Error(`Field ${fid} has too many categories for one-hot encoding.`);
    }
    return unique.map((member) => ({
        fid: `${fid}.[${String(member)}]`,
        name: name ? `${name} [${String(member)}]` : `${fid} [${String(member)}]`,
        semanticType: 'ordinal',
        values: values.map((value) => (stringKey(value) === stringKey(member) ? 1 : 0)),
    }));
}

function encodeOneHotWithNoiseColumns(fid: string, name: string | undefined, values: readonly unknown[]): EncodedColumn[] {
    const counts = buildCountEntries(values);
    const topK = 16;
    const grouped = counts.length <= topK
        ? counts.map((entry, index) => ({ label: String(entry.value), code: index, keys: [entry.key] }))
        : [
            ...counts.slice(0, topK - 1).map((entry, index) => ({ label: String(entry.value), code: index, keys: [entry.key] })),
            { label: '~', code: topK - 1, keys: counts.slice(topK - 1).map((entry) => entry.key) },
        ];

    return grouped.map((bucket) => ({
        fid: `${fid}.[${bucket.label}]`,
        name: name ? `${name} [${bucket.label}]` : `${fid} [${bucket.label}]`,
        semanticType: 'ordinal',
        values: values.map((value) => (bucket.keys.includes(stringKey(value)) ? 1 : 0)),
    }));
}

function encodeCategoricalField(
    field: CausalDiscoveryField,
    values: readonly unknown[],
    encodeType: string
): EncodedColumn[] {
    switch (encodeType) {
        case 'lex':
            return [{
                fid: field.fid,
                name: field.name,
                semanticType: 'ordinal',
                values: rankLexicographic(values),
            }];
        case 'one-hot':
            return encodeOneHotColumns(field.fid, field.name, values);
        case 'one-hot-with-noise':
            return encodeOneHotWithNoiseColumns(field.fid, field.name, values);
        case 'topk-with-noise':
            return [{
                fid: field.fid,
                name: field.name,
                semanticType: 'ordinal',
                values: encodeTopKWithNoise(values),
            }];
        case 'none':
        default: {
            const { codes } = factorize(values);
            return [{
                fid: field.fid,
                name: field.name,
                semanticType: 'ordinal',
                values: codes,
            }];
        }
    }
}

function encodeQuantitativeField(
    field: CausalDiscoveryField,
    values: readonly unknown[],
    encodeType: string
): EncodedColumn[] {
    const numericValues = values.map(toNumericValue);
    switch (encodeType) {
        case 'order': {
            const { codes } = factorize(numericValues, true);
            return [{
                fid: field.fid,
                name: field.name,
                semanticType: 'ordinal',
                values: codes,
            }];
        }
        case 'bin': {
            const finiteValues = numericValues.filter((value) => Number.isFinite(value));
            const min = finiteValues.length > 0 ? Math.min(...finiteValues) : 0;
            const max = finiteValues.length > 0 ? Math.max(...finiteValues) : min;
            const width = max - min;
            if (width === 0) {
                return [{
                    fid: field.fid,
                    name: field.name,
                    semanticType: 'ordinal',
                    values: numericValues,
                }];
            }
            const n = 16;
            const scale = width / (n - 1e-5);
            return [{
                fid: field.fid,
                name: field.name,
                semanticType: 'ordinal',
                values: numericValues.map((value) => {
                    if (!Number.isFinite(value)) {
                        return Number.NaN;
                    }
                    return Math.floor(((value - min) * (n - 1e-5)) / width) * scale;
                }),
            }];
        }
        case 'none':
        default:
            return [{
                fid: field.fid,
                name: field.name,
                semanticType: field.semanticType,
                values: numericValues,
            }];
    }
}

function encodeTemporalField(
    field: CausalDiscoveryField,
    values: readonly unknown[],
    params: DiscoveryParams
): EncodedColumn[] {
    const numericValues = values.map(toNumericValue);
    const shouldUseCategoricalEncoding = numericValues.some((value) => !Number.isFinite(value));
    if (shouldUseCategoricalEncoding) {
        return encodeCategoricalField(field, values, params.catEncodeType ?? 'topk-with-noise');
    }
    return encodeQuantitativeField(field, numericValues, params.quantEncodeType ?? 'bin');
}

function transformDataSource(
    dataSource: readonly IRow[],
    fields: readonly CausalDiscoveryField[],
    params: DiscoveryParams
): EncodedDataset {
    const encodedColumns: EncodedColumn[] = [];

    for (const field of fields) {
        const values = dataSource.map((row) => row[field.fid]);
        if (isNominalField(field)) {
            encodedColumns.push(...encodeCategoricalField(field, values, params.catEncodeType ?? 'topk-with-noise'));
            continue;
        }
        if (isTemporalField(field)) {
            encodedColumns.push(...encodeTemporalField(field, values, params));
            continue;
        }
        if (isNumericField(field)) {
            encodedColumns.push(...encodeQuantitativeField(field, values, params.quantEncodeType ?? 'bin'));
            continue;
        }
        encodedColumns.push(...encodeCategoricalField(field, values, params.catEncodeType ?? 'topk-with-noise'));
    }

    const rows = dataSource.map((_, rowIndex) => encodedColumns.map((column) => column.values[rowIndex] ?? Number.NaN));
    return {
        data: new DenseMatrix(rows),
        fields: encodedColumns.map(({ fid, name, semanticType }) => ({ fid, name, semanticType })),
    };
}

function expandFocusedFields(fields: readonly Pick<CausalDiscoveryField, 'fid'>[], focusedFields: readonly string[]): string[] {
    const expanded: string[] = [];
    for (const focusedField of focusedFields) {
        for (const field of fields) {
            if (field.fid === focusedField || (field.fid.startsWith(`${focusedField}.[`) && field.fid.endsWith(']'))) {
                expanded.push(field.fid);
            }
        }
    }
    return expanded;
}

function expandFieldIds(fieldIds: readonly string[], sourceFieldId: string): string[] {
    const matches = fieldIds.filter((fieldId) =>
        fieldId === sourceFieldId || (fieldId.startsWith(`${sourceFieldId}.[`) && fieldId.endsWith(']'))
    );
    return matches.length > 0 ? matches : [sourceFieldId];
}

function buildBackgroundKnowledge(
    bgKnowledgesPag: readonly PagLink[],
    focusedFields: readonly string[]
): BackgroundKnowledge | undefined {
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
        const backgroundKnowledge = buildBackgroundKnowledge(
            request.bgKnowledgesPag,
            [...observedFields.map((field) => field.fid), contextLabel]
        );

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
                kind: params.indep_test === 'fisherz'
                    ? 'fisher-z'
                    : params.indep_test === 'gsq'
                        ? 'g-square'
                        : 'chi-square',
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
