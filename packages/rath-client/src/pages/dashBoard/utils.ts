export function mean(values: number[]): number {
    let _sum = 0;
    for (let i = 0; i < values.length; i++) {
        _sum += values[i];
    }
    return _sum / values.length;
}

export function sum(values: number[]): number {
    let _sum = 0;
    for (let i = 0; i < values.length; i++) {
        _sum += values[i];
    }
    return _sum;
}

export function count(values: number[]): number {
    return values.length;
}

export function numberWithCommas(x: number): string {
    let parts = x.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}
