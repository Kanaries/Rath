import produce from 'immer';
import { IRow, IVegaSubset, PAINTER_MODE } from '../../interfaces';
import { LABEL_FIELD_KEY, LABEL_INDEX } from './constants';

export function batchMutInRange (mutData: IRow, field: string, range: [number, number], key: string, value: any) {
    for (let i = 0; i < mutData.length; i++) {
        if (mutData[i][field] >= range[0] && mutData[i][field] <= range[1]) {
            mutData[i][key] = value;
        }
    }
}

interface BatchMutInCircleProps {
    mutData: IRow;
    fields: [string, string];
    point: [number, number];
    r: number;
    a: number;
    b: number;
    key: string;
    value: any;
    indexKey: string;
    painterMode?: PAINTER_MODE
}
export function batchMutInCircle (props: BatchMutInCircleProps) {
    const {
        mutData,
        fields,
        point,
        a,
        b,
        r,
        key,
        value,
        indexKey,
        painterMode = PAINTER_MODE.COLOR
    } = props;
    const mutIndices = new Set();
    const mutValues: IRow[] = [];
    for (let i = 0; i < mutData.length; i++) {
        if (((mutData[i][fields[0]] - point[0]) ** 2) / (a ** 2) + ((mutData[i][fields[1]] - point[1]) ** 2) / (b ** 2) <= (r ** 2)) {
            if (painterMode === PAINTER_MODE.COLOR) {
                if (mutData[i][key] !== value) {
                    mutData[i][key] = value;
                    mutValues.push(mutData[i])
                    mutIndices.add(mutData[i][indexKey])
                }
            } else if (painterMode === PAINTER_MODE.ERASE) {
                mutValues.push(mutData[i])
                mutIndices.add(mutData[i][indexKey])
            }
        }
    }
    return {
        mutIndices,
        mutValues
    }
}

interface BatchMutInCatRangeProps {
    mutData: IRow;
    fields: [string, string];
    point: [any, number];
    r: number;
    range: number;
    key: string;
    value: any;
    indexKey: string;
}
export function batchMutInCatRange (props: BatchMutInCatRangeProps) {
    const {
        mutData,
        fields,
        point,
        r,
        range,
        key,
        value,
        indexKey
    } = props;
    const mutIndices = new Set();
    const mutValues: IRow[] = [];
    for (let i = 0; i < mutData.length; i++) {
        if (mutData[i][fields[0]] === point[0]) {
            if (Math.abs(mutData[i][fields[1]] - point[1]) < r * Math.sqrt(range)) {
                if (mutData[i][key] !== value) {
                    mutData[i][key] = value;
                    mutValues.push(mutData[i])
                    mutIndices.add(mutData[i][indexKey])
                }
            }
        }
    }
    return {
        mutIndices,
        mutValues
    }
}

export function labelingData (data: IRow[], initValue: any) {
    return data.map((r, i) => {
        return { ...r, [LABEL_FIELD_KEY]: initValue, [LABEL_INDEX]: i };
    })
}

/**
 * It is not a normal debounce, I develop it for a temp special case.
 * @param initAction 
 * @param func 
 * @param waitFor 
 * @returns 
 */
export const debounceShouldNeverBeUsed = <F extends ((...args: any) => any)>(initAction: F, func: F, waitFor: number) => {
    let timeout: number = 0

    const debounced = (...args: any) => {
        initAction(...args)
        clearTimeout(timeout)
        setTimeout(() => func(...args), waitFor)
    }
    
    return debounced as (...args: Parameters<F>) => ReturnType<F>
}

export function clearAggregation (spec: IVegaSubset): IVegaSubset {
    const nextSpec = produce<IVegaSubset>(spec, draft => {
        Object.values(draft.encoding).forEach(ch => {
            if (ch.aggregate) ch.aggregate = undefined;
        })
        switch (draft.mark) {
            case 'area':
            case 'line':
            case 'boxplot':
                draft.mark = 'point';
                break;
            default:
                draft.mark = 'tick'
        }
    })
    return nextSpec;
}