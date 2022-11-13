import localforage from 'localforage';
import { STORAGES, STORAGE_INSTANCE } from '../constants';
import { IRow } from '../interfaces';

export interface IteratorStorageProps {
    storageName?: string;
    dbName?: string;
    itemKey: string;
}
export class IteratorStorage {
    public length: number = 0;
    public storageName: string = '';
    public dbName: string = '';
    public itemKey: string = '';
    public versionCode: number = -1;
    constructor (props: IteratorStorageProps) {
        const { storageName = STORAGES.ITERATOR, dbName = STORAGE_INSTANCE, itemKey } = props;
        this.storageName = storageName;
        this.dbName = dbName;
        this.itemKey = itemKey;
    }
    public async setAll (items: IRow[]) {
        const storages = localforage.createInstance({
            name: this.dbName,
            storeName: this.storageName
        });
        this.length = items.length;
        this.versionCode++;
        storages.setItem(this.itemKey, items);
    }
    public async getAll (): Promise<IRow[]> {
        const storages = localforage.createInstance({
            name: this.dbName,
            storeName: this.storageName
        });
        return storages.getItem(this.itemKey) as Promise<IRow[]>;
    }
    public exportConfig () {
        return {
            storageName: this.storageName,
            dbName: this.dbName,
            itemKey: this.itemKey
        }
    }
    public importConfig (config: IteratorStorageProps) {
        this.storageName = config.storageName || STORAGES.ITERATOR;
        this.dbName = config.dbName || STORAGE_INSTANCE;
        this.itemKey = config.itemKey;
    }
}