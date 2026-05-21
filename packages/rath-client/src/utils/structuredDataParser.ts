import { IMuteFieldBase, IRow } from '../interfaces';

export type IJSONAPIFormat = 'array' | 'array_with_meta' | 'others';
export type StructuredFileKind = 'json' | 'jsonl';

const JSON_EXTENSIONS = new Set(['.json']);
const JSONL_EXTENSIONS = new Set(['.jsonl', '.ndjson', '.jsonlines']);

const JSON_MIME_TYPES = new Set([
    'application/json',
    'application/x-ndjson',
    'application/ndjson',
    'application/jsonl',
]);

const WRAPPED_ARRAY_KEYS = ['data', 'records', 'results', 'items', 'rows'] as const;

function fileExtension(name: string): string {
    const dot = name.lastIndexOf('.');
    return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

export function getStructuredFileKind(file: File): StructuredFileKind | null {
    const ext = fileExtension(file.name);
    if (JSONL_EXTENSIONS.has(ext)) {
        return 'jsonl';
    }
    if (JSON_EXTENSIONS.has(ext) || JSON_MIME_TYPES.has(file.type)) {
        return 'json';
    }
    return null;
}

export function isStructuredDataFile(file: File): boolean {
    return getStructuredFileKind(file) !== null;
}

export function jsonDataFormatChecker(parsedData: unknown): IJSONAPIFormat {
    try {
        extractRecords(parsedData);
        if (Array.isArray(parsedData)) {
            return 'array';
        }
        if (
            parsedData !== null &&
            typeof parsedData === 'object' &&
            Array.isArray((parsedData as { dataSource?: unknown }).dataSource) &&
            Array.isArray((parsedData as { fields?: unknown }).fields)
        ) {
            return 'array_with_meta';
        }
        return 'array';
    } catch {
        return 'others';
    }
}

function stripFieldDistribution(field: Record<string, unknown>): IMuteFieldBase {
    const { distribution, ...rest } = field;
    return rest as unknown as IMuteFieldBase;
}

function normalizeFields(fields: unknown[]): IMuteFieldBase[] {
    return fields.map((field) => stripFieldDistribution(field as Record<string, unknown>));
}

export function extractRecords(parsed: unknown): {
    format: 'array' | 'array_with_meta';
    rows: IRow[];
    fields?: IMuteFieldBase[];
} {
    if (Array.isArray(parsed)) {
        assertRecordArray(parsed);
        return { format: 'array', rows: parsed as IRow[] };
    }
    if (parsed !== null && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        if (Array.isArray(obj.dataSource) && Array.isArray(obj.fields)) {
            assertRecordArray(obj.dataSource);
            return {
                format: 'array_with_meta',
                rows: obj.dataSource as IRow[],
                fields: normalizeFields(obj.fields),
            };
        }
        for (const key of WRAPPED_ARRAY_KEYS) {
            const candidate = obj[key];
            if (Array.isArray(candidate)) {
                assertRecordArray(candidate);
                return { format: 'array', rows: candidate as IRow[] };
            }
        }
        if (!Array.isArray(parsed)) {
            return { format: 'array', rows: [parsed as IRow] };
        }
    }
    throw new Error('Unsupported JSON structure. Expected an array of records, JSONL lines, or { fields, dataSource }.');
}

function assertRecordArray(rows: unknown[]): void {
    if (rows.length === 0) {
        return;
    }
    const invalid = rows.find(
        (row) => row === null || typeof row !== 'object' || Array.isArray(row),
    );
    if (invalid !== undefined) {
        throw new Error('Each record must be a JSON object with field keys.');
    }
}

export function parseJsonDocumentText(text: string): unknown {
    const trimmed = text.trim();
    if (!trimmed) {
        throw new Error('File is empty.');
    }
    try {
        return JSON.parse(trimmed);
    } catch (error) {
        throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export function parseJsonlText(text: string): IRow[] {
    const rows: IRow[] = [];
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) {
            continue;
        }
        let parsed: unknown;
        try {
            parsed = JSON.parse(line);
        } catch (error) {
            throw new Error(
                `Invalid JSON on line ${i + 1}: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error(`Line ${i + 1} must be a JSON object (one record per line).`);
        }
        rows.push(parsed as IRow);
    }
    if (rows.length === 0) {
        throw new Error('JSONL file has no records.');
    }
    return rows;
}

export async function loadStructuredDataText(
    text: string,
    kind: StructuredFileKind,
): Promise<{ fields: IMuteFieldBase[]; dataSource: IRow[] }> {
    if (kind === 'jsonl') {
        const rows = parseJsonlText(text);
        return { fields: [], dataSource: rows };
    }
    const parsed = parseJsonDocumentText(text);
    const extracted = extractRecords(parsed);
    if (extracted.format === 'array_with_meta' && extracted.fields) {
        return { fields: extracted.fields, dataSource: extracted.rows };
    }
    return { fields: [], dataSource: extracted.rows };
}
