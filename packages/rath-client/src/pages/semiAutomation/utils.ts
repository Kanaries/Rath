import { IFilter } from "../../dev";
import { IRow } from "../../interfaces";

// export function applyFilter (dataSource: IRow[], filters?: IFilter[]): IRow[] {
//     if (!filters || filters.length === 0) return dataSource;
//     return dataSource.filter(row => {
//         return filters.every(f => f.values.includes(row[f.field.fid]))
//     })
// }
export function applyFilter (dataSource: IRow[], filters?: IFilter[]): IRow[] {
    if (!filters || filters.length === 0) return dataSource;
    const subset: IRow[] = [];
    const filterValueSetList: Array<Set<any>> = [];
    for (let i = 0; i < filters.length; i++) {
        filterValueSetList.push(new Set(filters[i].values))
    }
    for (let i = 0; i < dataSource.length; i++) {
        for (let j = 0; j < filters.length; j++) {
            if (filterValueSetList[j].has(dataSource[i][filters[j].field.fid])) {
                subset.push(dataSource[i])
            }
        }
    }
    return subset
}