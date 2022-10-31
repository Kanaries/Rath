import { makeAutoObservable } from "mobx";
import type { DashboardItem } from "../pages/dashboard";
import type { IFieldMeta, IFilter } from "../interfaces";


export interface DashboardDocument {
    filters: {
        field: IFieldMeta;
        filter: IFilter;
    }[];
    items: DashboardItem[];
}

export default class DashboardStore {

    public pages: DashboardDocument[];
    public cursor: number;

    constructor() {
        makeAutoObservable(this);
        this.pages = [{
            filters: [],
            items: [],
        }];
        this.cursor = 0;
    }

    public addItem(item: DashboardItem) {
        this.pages[this.cursor].items.push(item);
    }

    public setItem(index: number, item: DashboardItem) {
        this.pages[this.cursor].items[index] = item;
    }

    public removeItem(index: number) {
        this.pages[this.cursor].items.splice(index, 1);
    }

    public addFilter(field: IFieldMeta, filter: IFilter) {
        this.pages[this.cursor].filters.push({ field, filter });
    }

    public deleteFilter(index: number) {
        this.pages[this.cursor].filters.splice(index, 1);
    }

    public clearPage() {
        this.pages[this.cursor].items = [];
    }

    public newPage() {
        this.pages.push({
            filters: [],
            items: [],
        });
        this.cursor = this.pages.length - 1;
    }

    public setCursor(index: number) {
        this.cursor = index;
    }

    public get page() {
        return this.pages[this.cursor];
    }

}

