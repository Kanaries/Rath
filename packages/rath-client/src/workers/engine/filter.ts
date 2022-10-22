import { ICol, IFilter, IRow } from "../../interfaces";

export function applyFilters (dataSource: IRow[],
    extFields: Map<string, ICol<any>>,
    filters: IFilter[]) {
    const ans: IRow[] = [];
    if (filters.length === 0) return dataSource;
    // const effectFilters = filters.filter(f => !f.disable);
    const effectFilters = filters.filter(f => !f.disable && !extFields.has(f.fid));
    const effectExtFilters = filters.filter(f => !f.disable && extFields.has(f.fid));
    let extRow: {[key: string]: any} = new Object();
    for (let [key, val] of extFields.entries()) extRow[key] = val.data.at(0);

    for (let i = 0; i < dataSource.length; i++) {
        const row = dataSource[i];
        console.log(i, row);
        let keep = effectFilters.every(f => {
            if (f.type === 'range') return f.range[0] <= row[f.fid] && row[f.fid] <= f.range[1];
            if (f.type === 'set') return f.values.includes(row[f.fid]);
            return false;
        })
        && effectExtFilters.every(f => {
            if (f.type === 'range') return f.range[0] <= extFields.get(f.fid)!.data[i] && extFields.get(f.fid)!.data[i] <= f.range[1];
            if (f.type === 'set') return f.values.includes(extFields.get(f.fid)!.data[i]);
            return false;
        })
        if (keep) {
            for (let [key, val] of extFields.entries()) extRow[key] = val.data.at(i);
            ans.push(Object.assign({}, row, {...extRow}));
            // ans.push(row);
        }
    }
    return ans
}