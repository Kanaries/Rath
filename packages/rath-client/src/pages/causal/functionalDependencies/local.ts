import { anm, ChiSquareTest } from '@kanaries/causal';
import type { IRow } from '../../../interfaces';
import type { IFunctionalDep } from '../config';
import type { CausalDiscoveryField } from '../discoveryTypes';
import { transformDataSource } from '../dataTransform';

const INDEPENDENCE_ALPHA = 10 ** -3.3010299956639813;
const ORIENTATION_RATIO = 10 ** 3;
const MAX_ANM_SAMPLES = 128;
const MIN_ANM_SAMPLES = 8;

export interface FunctionalDependencyDetectionRequest {
    dataSource: readonly IRow[];
    fields: readonly CausalDiscoveryField[];
}

function downsamplePair(left: readonly number[], right: readonly number[]): [number[], number[]] {
    const finitePairs = left
        .map((value, index) => [value, right[index]] as const)
        .filter(([leftValue, rightValue]) => Number.isFinite(leftValue) && Number.isFinite(rightValue));

    if (finitePairs.length <= MAX_ANM_SAMPLES) {
        return [finitePairs.map(([value]) => value), finitePairs.map(([, value]) => value)];
    }

    const sampled = Array.from({ length: MAX_ANM_SAMPLES }, (_, index) => {
        const sourceIndex = Math.floor((index * finitePairs.length) / MAX_ANM_SAMPLES);
        return finitePairs[sourceIndex];
    });
    return [sampled.map(([value]) => value), sampled.map(([, value]) => value)];
}

export function detectFunctionalDependencies({ dataSource, fields }: FunctionalDependencyDetectionRequest): IFunctionalDep[] {
    if (dataSource.length === 0 || fields.length < 2) {
        return [];
    }

    const transformed = transformDataSource(dataSource, fields, {
        catEncodeType: 'topk-with-noise',
        quantEncodeType: 'bin',
    });
    const ciTest = new ChiSquareTest(transformed.data);
    const columns = transformed.data.toArray().reduce<number[][]>(
        (result, row) => {
            row.forEach((value, columnIndex) => {
                result[columnIndex]?.push(value);
            });
            return result;
        },
        Array.from({ length: transformed.fields.length }, () => [])
    );
    const paramsByTarget = new Map<string, Map<string, IFunctionalDep['params'][number]>>();

    const addDependency = (sourceIndex: number, targetIndex: number) => {
        const source = transformed.fields[sourceIndex]?.fid;
        const target = transformed.fields[targetIndex]?.fid;
        if (!source || !target || source === target) {
            return;
        }
        const params = paramsByTarget.get(target) ?? new Map<string, IFunctionalDep['params'][number]>();
        params.set(source, { fid: source, type: 'FuncDepTest' });
        paramsByTarget.set(target, params);
    };

    for (let leftIndex = 0; leftIndex < transformed.fields.length - 1; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < transformed.fields.length; rightIndex += 1) {
            const independencePValue = ciTest.test(leftIndex, rightIndex, []);
            if (!Number.isFinite(independencePValue) || independencePValue >= INDEPENDENCE_ALPHA) {
                continue;
            }

            const [left, right] = downsamplePair(columns[leftIndex], columns[rightIndex]);
            if (left.length < MIN_ANM_SAMPLES) {
                continue;
            }

            const { forwardPValue, backwardPValue } = anm(left, right);
            if (forwardPValue > backwardPValue * ORIENTATION_RATIO) {
                addDependency(leftIndex, rightIndex);
            } else if (backwardPValue > forwardPValue * ORIENTATION_RATIO) {
                addDependency(rightIndex, leftIndex);
            }
        }
    }

    return transformed.fields.flatMap((field) => {
        const params = paramsByTarget.get(field.fid);
        return params && params.size > 0 ? [{ fid: field.fid, params: [...params.values()] }] : [];
    });
}
