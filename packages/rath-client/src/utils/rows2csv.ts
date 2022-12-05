import { IFieldMeta, IRawField, IRow } from '../interfaces';

export function rows2csv(rows: IRow[], fields: IFieldMeta[]): string {
    const csv = rows
        .map((row) => {
            return fields
                .map((field) => {
                    return row[field.fid];
                })
                .join(',');
        })
        .join('\n');
    return fields.map(f => f.name || f.fid).join(',') + '\n' + csv;
}

export function compressRows(rows: IRow[], fields: IRawField[]): any[][] {
    return rows.map(row => fields.map(f => row[f.fid]));
}

export function uncompressRows(rows: any[][], fieldIds: string[]): IRow[] {
    return rows.map(row => {
        const obj: IRow = {};
        for (let i = 0; i < fieldIds.length; i++) {
            obj[fieldIds[i]] = row[i];
        }
        return obj;
    });
}