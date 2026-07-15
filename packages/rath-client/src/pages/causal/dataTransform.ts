import dayjs from 'dayjs';
import { DenseMatrix } from '@kanaries/causal';
import type { IRow } from '../../interfaces';
import type { CausalDiscoveryField } from './discoveryTypes';

type EncodedColumn = {
    fid: string;
    name?: string;
    semanticType: CausalDiscoveryField['semanticType'];
    values: number[];
};

export type EncodedDataset = {
    data: DenseMatrix;
    fields: CausalDiscoveryField[];
};

export type DiscoveryParams = {
    catEncodeType?: string;
    quantEncodeType?: string;
    indep_test?: string;
    score_func?: string;
    [key: string]: any;
};

export function isNominalField(field: CausalDiscoveryField): boolean {
    return field.semanticType === 'nominal';
}

function isTemporalField(field: CausalDiscoveryField): boolean {
    return field.semanticType === 'temporal';
}

function isNumericField(field: CausalDiscoveryField): boolean {
    return field.semanticType === 'quantitative' || field.semanticType === 'ordinal';
}

export function toNumericValue(value: unknown): number {
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

export function encodeTopKWithNoise(values: readonly unknown[]): number[] {
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
    const grouped =
        counts.length <= topK
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

function encodeCategoricalField(field: CausalDiscoveryField, values: readonly unknown[], encodeType: string): EncodedColumn[] {
    switch (encodeType) {
        case 'lex':
            return [
                {
                    fid: field.fid,
                    name: field.name,
                    semanticType: 'ordinal',
                    values: rankLexicographic(values),
                },
            ];
        case 'one-hot':
            return encodeOneHotColumns(field.fid, field.name, values);
        case 'one-hot-with-noise':
            return encodeOneHotWithNoiseColumns(field.fid, field.name, values);
        case 'topk-with-noise':
            return [
                {
                    fid: field.fid,
                    name: field.name,
                    semanticType: 'ordinal',
                    values: encodeTopKWithNoise(values),
                },
            ];
        case 'none':
        default: {
            const { codes } = factorize(values);
            return [
                {
                    fid: field.fid,
                    name: field.name,
                    semanticType: 'ordinal',
                    values: codes,
                },
            ];
        }
    }
}

function encodeQuantitativeField(field: CausalDiscoveryField, values: readonly unknown[], encodeType: string): EncodedColumn[] {
    const numericValues = values.map(toNumericValue);
    switch (encodeType) {
        case 'order': {
            const { codes } = factorize(numericValues, true);
            return [
                {
                    fid: field.fid,
                    name: field.name,
                    semanticType: 'ordinal',
                    values: codes,
                },
            ];
        }
        case 'bin': {
            const finiteValues = numericValues.filter((value) => Number.isFinite(value));
            const min = finiteValues.length > 0 ? Math.min(...finiteValues) : 0;
            const max = finiteValues.length > 0 ? Math.max(...finiteValues) : min;
            const width = max - min;
            if (width === 0) {
                return [
                    {
                        fid: field.fid,
                        name: field.name,
                        semanticType: 'ordinal',
                        values: numericValues,
                    },
                ];
            }
            const n = 16;
            const scale = width / (n - 1e-5);
            return [
                {
                    fid: field.fid,
                    name: field.name,
                    semanticType: 'ordinal',
                    values: numericValues.map((value) => {
                        if (!Number.isFinite(value)) {
                            return Number.NaN;
                        }
                        return Math.floor(((value - min) * (n - 1e-5)) / width) * scale;
                    }),
                },
            ];
        }
        case 'none':
        default:
            return [
                {
                    fid: field.fid,
                    name: field.name,
                    semanticType: field.semanticType,
                    values: numericValues,
                },
            ];
    }
}

function encodeTemporalField(field: CausalDiscoveryField, values: readonly unknown[], params: DiscoveryParams): EncodedColumn[] {
    const numericValues = values.map(toNumericValue);
    const shouldUseCategoricalEncoding = numericValues.some((value) => !Number.isFinite(value));
    if (shouldUseCategoricalEncoding) {
        return encodeCategoricalField(field, values, params.catEncodeType ?? 'topk-with-noise');
    }
    return encodeQuantitativeField(field, numericValues, params.quantEncodeType ?? 'bin');
}

export function transformDataSource(dataSource: readonly IRow[], fields: readonly CausalDiscoveryField[], params: DiscoveryParams): EncodedDataset {
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

export function expandFocusedFields(fields: readonly Pick<CausalDiscoveryField, 'fid'>[], focusedFields: readonly string[]): string[] {
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
