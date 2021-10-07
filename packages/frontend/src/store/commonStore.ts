import { makeAutoObservable } from 'mobx';
import { PIVOT_KEYS } from '../constants';

export class CommonStore {
    public appKey: string = PIVOT_KEYS.dataSource;
    constructor() {
        makeAutoObservable(this);
    }
    public setAppKey (key: string) {
        this.appKey = key
    }
}
