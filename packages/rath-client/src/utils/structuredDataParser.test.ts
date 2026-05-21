import {
    extractRecords,
    parseJsonDocumentText,
    parseJsonlText,
} from './structuredDataParser';

describe('structuredDataParser', () => {
    it('parses a JSON array of records', () => {
        const rows = extractRecords([{ a: 1 }, { a: 2 }]).rows;
        expect(rows).toHaveLength(2);
    });

    it('parses Rath { fields, dataSource } format', () => {
        const { format, fields, rows } = extractRecords({
            fields: [{ fid: 'a', name: 'A', geoRole: '?', analyticType: '?', semanticType: '?' }],
            dataSource: [{ a: 1 }],
        });
        expect(format).toBe('array_with_meta');
        expect(fields).toHaveLength(1);
        expect(rows).toHaveLength(1);
    });

    it('parses wrapped { data: [...] } format', () => {
        const rows = extractRecords({ data: [{ x: 1 }] }).rows;
        expect(rows).toEqual([{ x: 1 }]);
    });

    it('parses a single JSON object as one row', () => {
        const rows = extractRecords({ x: 1, y: 2 }).rows;
        expect(rows).toEqual([{ x: 1, y: 2 }]);
    });

    it('parses JSONL with blank lines and comments', () => {
        const rows = parseJsonlText('# header\n{"a":1}\n\n{"a":2}\n');
        expect(rows).toEqual([{ a: 1 }, { a: 2 }]);
    });

    it('rejects invalid JSON', () => {
        expect(() => parseJsonDocumentText('{not json')).toThrow(/Invalid JSON/);
    });
});
