import { IFilter } from "../../dev";
import { IRow } from "../../interfaces";

export function applyFilter (dataSource: IRow[], filters?: IFilter[]): IRow[] {
    if (!filters || filters.length === 0) return dataSource;
    return dataSource.filter(row => {
        return filters.every(f => f.values.includes(row[f.field.fid]))
    })
}