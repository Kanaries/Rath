import localforage from 'localforage';

import { RESULT_STORAGE_SPLITOR, STORAGES, STORAGE_INSTANCE } from '../constants';
import { IFieldMeta, IMuteFieldBase, IRow } from '../interfaces';
import type { CausalLinkDirection } from './resolve-causal';

export interface IDBMeta {
    id: string;
    name: string;
    type: 'workspace' | 'dataset';
    createTime: number;
    editTime: number;
    size: number;
    rows?: number;
    fields?: IMuteFieldBase[];
}

export interface IModel {
    metas: IFieldMeta[];
    causal: {
        corMatrix: number[][];
        causalMatrix: CausalLinkDirection[][];
        fieldIds: string[];
        algorithm: string;
        params: {
            [key: string]: any
        }
    }
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
    const values = await Promise.all(keys.map(itemKey => metas.getItem(itemKey))) as IDBMeta[];
    return values.filter(v => v.type === 'workspace' || v.type === undefined);
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

export async function getDataStorageList (): Promise<IDBMeta[]> {
    const metas = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.META
    });
    const keys = await metas.keys();
    const values = await Promise.all(keys.map(itemKey => metas.getItem(itemKey))) as IDBMeta[];
    return values.filter(v => v.type === 'dataset');
}

export async function getDataStorageById (id: string): Promise<{ fields: IMuteFieldBase[]; dataSource: IRow[] }> {
    const metas = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.META
    });
    const meta: IDBMeta = await metas.getItem(id) as IDBMeta
    const storages = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.DATASOURCE
    });
    const data = await storages.getItem(id) as IRow[]
    return {
        fields: meta.fields || [],
        dataSource: data
    }
}

export async function deleteDataStorageById (id: string) {
    const metas = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.META
    });
    const storages = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.DATASOURCE
    });
    await metas.removeItem(id);
    await storages.removeItem(id)
}

export async function setDataStorage(name: string, fields: IMuteFieldBase[], dataSource: IRow[]) {
    const time = Date.now();
    const dataString = JSON.stringify(dataSource);
    const metas = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.META
    });
    await metas.setItem(name, {
        id: name,
        name,
        type: 'dataset',
        createTime: time,
        editTime: time,
        size: Math.round(dataString.length / 1024),
        rows: dataSource.length,
        fields
    } as IDBMeta)
    const storages = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.DATASOURCE
    });
    storages.setItem(name, dataSource);
}

export async function updateDataStorageMeta(name: string, fields: IMuteFieldBase[]) {
    const metas = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.META
    });
    const oldMeta = await metas.getItem(name) as IDBMeta;
    await metas.setItem(name, {
        ...oldMeta,
        fields,
        editTime: Date.now()
    } as IDBMeta)
}

export async function setModelStorage (name: string, model: IModel) {
    const modelBucket = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.MODEL
    })
    await modelBucket.setItem(name, model);
}

export async function deleteModelStorage (name: string, model: IModel) {
    const modelBucket = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.MODEL
    })
    await modelBucket.removeItem(name);
}

export async function getModelStorage (name: string): Promise<IModel> {
    const modelBucket = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.MODEL
    })
    return await modelBucket.getItem(name) as IModel;
}

export async function getModelStorageList (): Promise<string[]> {
    const modelBucket = localforage.createInstance({
        name: STORAGE_INSTANCE,
        storeName: STORAGES.MODEL
    })
    return await modelBucket.keys();
}

// export async function setStateInStorage(key: string, value: any) {
//     // const state = localforage.createInstance({
//     //     name: STORAGE_INSTANCE,
//     //     storeName: STORAGES.STATE
//     // });
//     // await state.setItem(key, value)
// }

// export async function getStateInStorage(key: string) {
//     const state = localforage.createInstance({
//         name: STORAGE_INSTANCE,
//         storeName: STORAGES.STATE
//     });
//     const val = await state.getItem(key)
//     return val;
// }