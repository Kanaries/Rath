import { makeAutoObservable } from 'mobx';

export class CommonStore {
    public appKey: string = 'pivot-1';
    constructor() {
        makeAutoObservable(this);
    }
    public setAppKey (key: string) {
        this.appKey = key
    }
}
