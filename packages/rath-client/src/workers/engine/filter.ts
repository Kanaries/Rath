import { ICol, IFilter, IRow } from "../../interfaces";

/**
 * @deprecated
 * TODO: remove this
 */
export function applyFilters (dataSource: IRow[],
    extFields: Map<string, ICol<any>>,
    filters: IFilter[]) {
    const ans: IRow[] = [];
    // const effectFilters = filters.filter(f => !f.disable);
    const effectFilters = filters.filter(f => !f.disable && !extFields.has(f.fid));
    const effectExtFilters = filters.filter(f => !f.disable && extFields.has(f.fid));
    let extRow: IRow = {}
    for (let [key, val] of extFields.entries()) {
        if (val.data.length !== dataSource.length) throw new Error("applyFilter: data lengths not match");
        extRow[key] = val.data.at(0);
    }

    for (let i = 0; i < dataSource.length; i++) {
        const row = dataSource[i];
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
            ans.push(Object.assign({}, row, extRow) as IRow);
            // ans.push(row);
        }
    }
    return ans
}