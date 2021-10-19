import { IAPP_CONFIG } from "./interfaces";

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