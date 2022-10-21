import { IFilter } from '@kanaries/loa'
import dayjs from 'dayjs';
import { IRow } from "../../../interfaces";

export function formatNumbers(value: number): string {
    if (value === null || value === undefined) {
        return '';
    }
    return value.toLocaleString();
}


export function patchFilterTemporalRange (data: IRow[], filters: IFilter[]) {
    if (filters.length === 0) return data;
    const ans: IRow[] = [];
    const rangeFilters = filters.filter(f => f.type === 'range');
    for (let row of data) {
        let flag = true;
        for (let filter of rangeFilters) {
            const t = dayjs(row[filter.fid]).valueOf();
            // @ts-ignore
            if (t < filter.range[0] || t > filter.range[1]) {
                flag = false;
            }
        }
        if (flag) {
            ans.push(row);
        }
    }
    return ans
}