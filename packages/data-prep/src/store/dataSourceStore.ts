import { makeAutoObservable } from "mobx";
import { IPageKey } from "../interfaces";

export class DataSourceStore {
    public pageKey: IPageKey = IPageKey.CREATE;
    constructor () {
        makeAutoObservable(this);
    }
    public setPageKey (pk: IPageKey): void {
        this.pageKey = pk;
    }
}