import localforage from "localforage";

export function intersect (A: string[], B: string[]) {
    const bset = new Set(B);
    if (A.length === 0 || B.length === 0) return true;
    for (let a of A) {
        if (bset.has(a)) return true
    }
    return false;
}

export async function setStateInStorage(key: string, value: any) {
    const state = localforage.createInstance({
        name: 'STORAGE_INSTANCE',
        storeName: 'STORAGES.STATE'
    });
    await state.setItem(key, value)
}

export async function getStateInStorage(key: string) {
    const state = localforage.createInstance({
        name: 'STORAGE_INSTANCE',
        storeName: 'STORAGES.STATE'
    });
    const val = await state.getItem(key)
    return val;
}