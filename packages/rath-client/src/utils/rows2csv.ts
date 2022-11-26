import { IFieldMeta, IRow } from '../interfaces';

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
