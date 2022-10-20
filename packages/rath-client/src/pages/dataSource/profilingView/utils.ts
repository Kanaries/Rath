export function formatNumbers(value: number): string {
    if (value === null || value === undefined) {
        return '';
    }
    return value.toLocaleString();
}
