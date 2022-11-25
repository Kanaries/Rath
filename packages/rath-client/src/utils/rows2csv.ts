import { IRow } from '../interfaces';

export function rows2csv(rows: IRow[], fields: string[]): string {
    const csv = rows
        .map((row) => {
            return fields
                .map((field) => {
                    return row[field];
                })
                .join(',');
        })
        .join('\n');
    return csv;
}
