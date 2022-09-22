const ID_RULES = [
    /.*[iI][dD]$/
]
export function inferIDFromName (colName?: string): boolean {
    if (typeof colName === 'undefined') return false;
    return ID_RULES.some(rule => rule.test(colName))
}