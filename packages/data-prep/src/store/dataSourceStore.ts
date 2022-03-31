import { makeAutoObservable } from "mobx";

export class DataSourceStore {
    constructor () {
        makeAutoObservable(this);
    }
}