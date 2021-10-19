export function intersect (A: string[], B: string[]) {
    const bset = new Set(B);
    for (let a of A) {
        if (bset.has(a)) return true
    }
    return false;
}