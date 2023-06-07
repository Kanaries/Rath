import { IteratorStorage } from '../../utils/iteStorage';

function isNumeric(str: any) {
    if (typeof str === 'number') return true;
    if (typeof str !== 'string') return false; // we only process strings!
    return (
        // @ts-ignore
        !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str))
    ); // ...and ensure strings of whitespace fail
}

export async function getOriginalRange(dataStorage: IteratorStorage, colKey: string): Promise<[number, number]> {
    const rows = await dataStorage.getAll();
    const values: number[] = [];
    for (let row of rows) {
        const val = row[colKey];
        if (isNumeric(val)) {
            values.push(Number(val));
        }
    }
    if (values.length === 0) return [0, 0];
    let _min = Infinity;
    let _max = -Infinity;
    for (const v of values) {
        if (Number.isNaN(v)) continue;
        if (v > _max) _max = v;
        if (v < _min) _min = v;
    }
    return [_min, _max].every(Number.isFinite) ? [_min, _max] : [0, 0];
}

export async function getOriginalDateTimeRange(dataStorage: IteratorStorage, colKey: string): Promise<[number, number]> {
    const rows = await dataStorage.getAll();
    const values: number[] = [];
    for (let row of rows) {
        const val = new Date(row[colKey]).getTime();
        if (Number.isFinite(val)) { // we only process valid date time
            values.push(val);
        }
    }
    if (values.length === 0) return [0, 0];
    let _min = Infinity;
    let _max = -Infinity;
    for (const v of values) {
        if (Number.isNaN(v)) continue;
        if (v > _max) _max = v;
        if (v < _min) _min = v;
    }
    return [_min, _max].every(Number.isFinite) ? [_min, _max] : [0, 0];
}
