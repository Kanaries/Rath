import { IAPP_CONFIG } from "./interfaces";
import path from 'path';
import fs from 'fs/promises';

export class GlobalStore {
    private config: IAPP_CONFIG | null;
    constructor (config: IAPP_CONFIG | null | undefined = null) {
        this.config = config
    }
    public getConfig (): IAPP_CONFIG {
        if (this.config === null) {
            throw '应用全局配置信息错误，检查应用的配置信息是否被正确获取或者后续存在非法的修改操作.'
        } else {
            return this.config;
        }
    }
    public async syncConfig (): Promise<IAPP_CONFIG>  {
        const filePath = path.resolve(__dirname, '../app-config.json');
        const dataBuffer = await fs.readFile(filePath);
        const data = JSON.parse(dataBuffer.toString()) as IAPP_CONFIG;
        this.config = data;
        return data;
    }
    public async setConfig (config: IAPP_CONFIG) {
        const filePath = path.resolve(__dirname, '../app-config.json');
        await fs.writeFile(filePath, JSON.stringify(config));
        this.config = config
    }
}

const storeRef: { ref: GlobalStore } = {
    ref: new GlobalStore()
};

export function useGlobalStore() {
    return storeRef.ref;
}

export function updateGlobalStore (value: GlobalStore) {
    storeRef.ref = value;
}