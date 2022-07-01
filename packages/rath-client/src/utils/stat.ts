export function getRange(values: number[]): [number, number] {
    let _min = Infinity;
    let _max = -Infinity;
    for (let i = 0; i < values.length; i++) {
        if (values[i] > _max) _max = values[i];
        if (values[i] < _min) _min = values[i];
    }
    return [_min, _max]
}