import localforage from 'localforage';
import { STORAGES, STORAGE_INSTANCE } from '../constants';
import { IRow, IteratorStorageMetaInfo } from '../interfaces';

export interface IteratorStorageProps {
    storageName?: string;
    dbName?: string;
    itemKey: string;
    versionCode?: number;
    metaStorageName?: string;
    metaInfo?: IteratorStorageMetaInfo;
}

export class IteratorStorage {
    public storageName: string = '';
    public metaStorageName: string = '';
    public dbName: string = '';
    public itemKey: string = '';
    public metaInfo: IteratorStorageMetaInfo;
    constructor(props: IteratorStorageProps) {
        const {
            storageName = STORAGES.ITERATOR,
            metaStorageName = STORAGES.ITERATOR_META,
            dbName = STORAGE_INSTANCE,
            itemKey,
            metaInfo = {
                versionCode: -1,
                length: 0
            }
        } = props;
        this.storageName = storageName;
        this.dbName = dbName;
        this.itemKey = itemKey;
        this.metaStorageName = metaStorageName;
        this.metaInfo = metaInfo
    }
    public async setAll(items: IRow[]) {
        const storage = localforage.createInstance({
            name: this.dbName,
            storeName: this.storageName,
        });
        await storage.setItem(this.itemKey, items);
        const metaInfo = await this.syncMetaInfoFromStorage();
        await this.updateMetaInfo({
            versionCode: metaInfo.versionCode + 1,
            length: items.length
        })
    }
    public async getAll(): Promise<IRow[]> {
        const storages = localforage.createInstance({
            name: this.dbName,
            storeName: this.storageName,
        });
        return storages.getItem(this.itemKey) as Promise<IRow[]>;
    }
    public async syncMetaInfoFromStorage() {
        const metaStorage = localforage.createInstance({
            name: this.dbName,
            storeName: this.metaStorageName,
        });
        const metaInfo = await metaStorage.getItem(this.itemKey) as IteratorStorageMetaInfo;
        if (metaInfo) {
            this.metaInfo = metaInfo;
        }
        return this.metaInfo;
    }
    public async updateMetaInfo(metaInfo: IteratorStorageMetaInfo) {
        const metaStorage = localforage.createInstance({
            name: this.dbName,
            storeName: this.metaStorageName,
        });
        await metaStorage.setItem(this.itemKey, metaInfo);
        this.metaInfo = metaInfo;
    }
}
