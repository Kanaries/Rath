import { ICol, IFilter, IRawField, IRow } from "../../interfaces";

const resolveNumericValue = (row: IRow, f: IRawField): number => {
    const val = row[f.fid];
    if (f.semanticType === 'temporal') {
        return new Date(val).getTime();
    }
    return typeof val === 'number' ? val : Number(val);
};

/**
 * @deprecated
 * TODO: [refactor] remove this
 * kyusho, 7 days ago   (November 22nd, 2022 11:46 PM) 
 */
export function applyFilters (dataSource: IRow[],
    fields: IRawField[],
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
            if (f.type === 'range') {
                const field = fields.find(field => field.fid === f.fid);
                if (!field) return false;
                const val = resolveNumericValue(row, field);
                return f.range[0] <= val && val <= f.range[1];
            }
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