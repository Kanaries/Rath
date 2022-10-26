import { makeAutoObservable, observable, toJS } from "mobx";
import type { KanbanItem } from "../pages/kanban";
import produce from "immer";
import type { IFieldMeta, IFilter } from "../interfaces";


export interface DashboardDocument {
    filters: {
        field: IFieldMeta;
        filter: IFilter;
    }[];
    items: KanbanItem[];
}

export default class DashboardStore {

    public pages: DashboardDocument[];
    public cursor: number;

    constructor() {
        makeAutoObservable(this, {
            pages: observable.shallow,
        });
        this.pages = [{
            filters: [],
            items: [],
        }];
        this.cursor = 0;
    }

    public addItem(item: KanbanItem) {
        this.pages = produce(toJS(this.pages), draft => {
            draft[this.cursor].items.push(item);
        });
    }

    public setItem(index: number, item: KanbanItem) {
        this.pages = produce(toJS(this.pages), draft => {
            draft[this.cursor].items[index] = item;
        });
    }

    public addFilter(field: IFieldMeta, filter: IFilter) {
        this.pages = produce(toJS(this.pages), draft => {
            draft[this.cursor].filters.push({ field, filter });
        });
    }

    public deleteFilter(index: number) {
        this.pages = produce(toJS(this.pages), draft => {
            draft[this.cursor].filters.splice(index, 1);
        });
    }

    public clearPage() {
        this.pages = produce(toJS(this.pages), draft => {
            draft[this.cursor].items = [];
        });
    }

    public newPage() {
        this.pages = produce(toJS(this.pages), draft => {
            draft.push({
                filters: [],
                items: [],
            });
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

