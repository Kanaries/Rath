import { makeAutoObservable } from "mobx";
import type { DraggableFieldState, IVisualConfig } from "@kanaries/graphic-walker/dist/interfaces";
import type { IFieldMeta, IFilter } from "../interfaces";


export enum DashboardCardAppearance {
    /** 隐性底板（无样式 div） */
    Transparent = 'transparent',
    /** 阴影卡片 */
    Dropping = 'dropping',
    /** 扁平化底板。（只有border） */
    Outline = 'outline',
    /** 新拟态 @see https://neumorphism.io/ */
    Neumorphism = 'neumorphism',
}

export type DashboardCard = {
    layout: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    content: Partial<{
        title: string;
        text: string;
        chart: {
            /** calculated and passed to Vega */
            size: { w: number; h: number };
            encodings: DraggableFieldState;
            config: IVisualConfig;
        };
    }>;
};

/**
 * @deprecated use `DashboardCard` instead
 */
export type DashboardItem = {
    viewId: string;
    layout: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    chartSize: {
        w: number;
        h: number;
    };
    filter: {
        enabled: false;
    } | {
        enabled: true;
        data: IFilter[];
    };
};

export interface DashboardDocument {
    data: {
        /** Name of the data source, used to display and mention the data source */
        source: string;
        /** Filters working globally  */
        filters: {
            field: IFieldMeta;
            filter: IFilter;
        }[];
    };
    /** @deprecated use `cards` instead */
    items: DashboardItem[];
    /** All cards defined in the dashboard */
    cards: DashboardCard[];
    config: {
        size: { w: number; h: number };
        /**
         * Appearance of cards.
         * @default DashboardCardAppearance.Transparent
         */
        appearance: DashboardCardAppearance;
    };
}

export default class DashboardStore {

    public pages: DashboardDocument[];
    public cursor: number;

    constructor() {
        makeAutoObservable(this);
        this.pages = [{
            data: {
                source: 'context dataset', // TODO: get name from data source
                filters: [],
            },
            items: [],
            cards: [],
            config: {
                size: {
                    w: 128,
                    h: 128,
                },
                appearance: DashboardCardAppearance.Transparent,
            },
        }];
        this.cursor = 0;
    }

    public addItem(item: DashboardItem) {
        // TODO: rewrite using DashboardCard
        this.pages[this.cursor].items.push(item);
    }

    public setItem(index: number, item: DashboardItem) {
        // TODO: rewrite using DashboardCard
        this.pages[this.cursor].items[index] = item;
    }

    public removeItem(index: number) {
        // TODO: rewrite using DashboardCard
        this.pages[this.cursor].items.splice(index, 1);
    }

    public addFilter(field: IFieldMeta, filter: IFilter) {
        this.pages[this.cursor].data.filters.push({ field, filter });
    }

    public deleteFilter(index: number) {
        this.pages[this.cursor].data.filters.splice(index, 1);
    }

    public clearPage() {
        this.pages[this.cursor].items = [];
        this.pages[this.cursor].cards = [];
    }

    public newPage() {
        this.pages.push({
            data: {
                source: 'context dataset', // TODO: get name from data source
                filters: [],
            },
            items: [],
            cards: [],
            config: {
                size: {
                    w: 128,
                    h: 128,
                },
                appearance: DashboardCardAppearance.Transparent,
            },
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

