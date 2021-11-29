import localforage from 'localforage';
import { RESULT_STORAGE_SPLITOR } from '../constants';

export const STORAGE_INSTANCE = 'rath_storage_instance'
const STORAGES = {
    DATASOURCE: 'datasource',
    WORKSPACE: 'workspace',
    META: 'meta'
}

export interface IDBMeta {
    id: string;
    name: string;
    createTime: number;
    editTime: number;
    size: number;
}

export interface IRathStorage {
    dataStorage: string;
    engineStorage: string;
    appStorage: string;
}
export function RathStorageParse (raw: string): IRathStorage {
    const contents = raw.split(RESULT_STORAGE_SPLITOR);
    return {
        dataStorage: contents[0],
        engineStorage: contents[1],
        appStorage: contents[2]
    }
}

export function RathStorageDump (props: IRathStorage): string {
    return props.dataStorage + RESULT_STORAGE_SPLITOR + props.engineStorage + RESULT_STORAGE_SPLITOR + props.appStorage;
}

export async function getStorageListInLocal (): Promise<IDBMeta[]> {
    const metas = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.META
    });
    const keys = await metas.keys();
    // const _key = keys[0];
    // const res = await 
    // console.log(_key)
    const values = await Promise.all(keys.map(itemKey => metas.getItem(itemKey))) as IDBMeta[];
    return values
    // const storages = localforage.createInstance({
    //     name: STORAGE_INSTANCE,
    //     storeName: STORAGES.WORKSPACE
    // });
}

export async function getStorageByIdInLocal (id: string): Promise<string> {
    const storages = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.WORKSPACE
    });
    const st = await storages.getItem(id) as string
    return st
}

export async function setStorageByIdInLocal (id: string, name: string, value: string) {
    const time = Date.now();
    const metas = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.META
    });
    await metas.setItem(id, {
        id,
        name,
        createTime: time,
        editTime: time,
        size: Math.round(value.length / 1024)
    } as IDBMeta)
    const storages = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.WORKSPACE
    });
    storages.setItem(id, value);
}

export async function deleteStorageByIdInLocal (id: string) {
    const metas = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.META
    });
    const storages = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.WORKSPACE
    });
    await metas.removeItem(id);
    await storages.removeItem(id)
}