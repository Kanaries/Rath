import { IFilter, IRow } from "../../interfaces";

export function applyFilters (dataSource: IRow[], filters: IFilter[]) {
    const ans: IRow[] = [];
    if (filters.length === 0) return dataSource;
    const effectFilters = filters.filter(f => !f.disable);
    for (let i = 0; i < dataSource.length; i++) {
        const row = dataSource[i];
        let keep = effectFilters.every(f => {
            if (f.type === 'range') return f.range[0] <= row[f.fid] && row[f.fid] <= f.range[1];
            if (f.type === 'set') return f.values.includes(row[f.fid]);
            return false;
        })
        if (keep) ans.push(row);
    }
    return ans
}