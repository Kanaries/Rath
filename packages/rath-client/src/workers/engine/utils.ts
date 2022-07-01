export function intersect (A: string[], B: string[]) {
    const bset = new Set(B);
    if (A.length === 0 || B.length === 0) return true;
    for (let a of A) {
        if (bset.has(a)) return true
    }
    return false;
}