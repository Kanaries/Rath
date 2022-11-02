import { makeAutoObservable, runInAction, toJS } from "mobx";
import produce from "immer";
import type { IFieldMeta, IFilter, IVegaSubset } from "../interfaces";


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

export enum DashboardCardInsetLayout {
    /** 按卡片宽高比自动适配 */
    Auto,
    /** 横向布局 */
    Row,
    /** 纵向布局 */
    Column,
}

export type DashboardCard = {
    layout: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    align: DashboardCardInsetLayout;
    content: Partial<{
        title: string;
        text: string;
        chart: {
            subset: IVegaSubset;
            filters: IFilter[];
        };
    }>;
    config: {
        /**
         * Appearance of cards.
         * @default DashboardCardAppearance.Transparent
         */
        appearance: DashboardCardAppearance;
    };
};

export interface DashboardCardState extends DashboardCard {
    content: Partial<Required<DashboardCard['content']> & {
        chart: DashboardCard['content']['chart'] & {
            /* 这俩不要持久化 */
            selectors: IFilter[];
            size: { w: number; h: number };
        };
    }>;
}

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
    info: {
        name: string;
        description: string;
        createTime: number;
        lastModifyTime: number;
    };
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
    cards: DashboardCardState[];
    config: {
        size: { w: number; h: number };
        filters: IFilter[];
    };
}

export interface DashboardDocumentOperators {
    // document level
    copy: () => void;
    remove: () => void;
    download: () => void;
    setName: (name: string) => void;
    setDesc: (desc: string) => void;
    // data level
    addCard: (layout: DashboardCard['layout']) => number;
    moveCard: (index: number, x: number, y: number) => void;
    resizeCard: (index: number, w: number, h: number) => void;
}

export interface DashboardDocumentWithOperators {
    data: DashboardDocument;
    operators: Readonly<DashboardDocumentOperators>;
}

export default class DashboardStore {

    protected static writeDocumentObjectBlob(data: DashboardDocument): Blob {
        // TODO: optimize
        const part = JSON.stringify(data);
        const file = new Blob([ part ], { type: 'text/plain' });
        return file;
    }

    protected static async readObjectBlob(blob: Blob): Promise<DashboardDocument> {
        const text = await blob.text();
        // TODO: optimize
        const data = JSON.parse(text) as DashboardDocument;
        return data;
    }

    public name: string;
    public description: string;
    public pages: DashboardDocument[];
    /** @deprecated */
    public cursor: number;

    constructor() {
        makeAutoObservable(this);
        this.name = 'My Dashboard List';
        this.description = '';
        this.pages = [];
        this.cursor = 0;
        // FIXME: remove this call
        this.newPage();
    }

    /** @deprecated */
    public addItem(item: DashboardItem) {
        this.pages[this.cursor].items.push(item);
    }

    /** @deprecated */
    public setItem(index: number, item: DashboardItem) {
        this.pages[this.cursor].items[index] = item;
    }

    /** @deprecated */
    public removeItem(index: number) {
        this.pages[this.cursor].items.splice(index, 1);
    }

    /** @deprecated */
    public addFilter(field: IFieldMeta, filter: IFilter) {
        this.pages[this.cursor].data.filters.push({ field, filter });
    }

    /** @deprecated */
    public deleteFilter(index: number) {
        this.pages[this.cursor].data.filters.splice(index, 1);
    }

    /** @deprecated */
    public clearPage() {
        this.pages[this.cursor].items = [];
        this.pages[this.cursor].cards = [];
    }

    public newPage() {
        const now = Date.now();
        this.pages.push({
            info: {
                name: 'New Dashboard',
                description: '',
                createTime: now,
                lastModifyTime: now,
            },
            data: {
                source: 'context dataset', // TODO: get name from data source
                filters: [],
            },
            items: [],
            cards: [],
            config: {
                size: {
                    w: 256,
                    h: 256,
                },
                filters: [],
            },
        });
        this.cursor = this.pages.length - 1;
    }

    /** @deprecated */
    public setCursor(index: number) {
        this.cursor = index;
    }

    /** @deprecated */
    public get page() {
        return this.pages[this.cursor];
    }

    protected copyPage(index: number) {
        const page = this.pages[index];
        this.pages.push(produce(toJS(page), draft => {
            const now = Date.now();
            draft.info.createTime = now;
            draft.info.lastModifyTime = now;
            draft.info.name = `${draft.info.name} (copy)`;
        }));
    }
    protected removePage(index: number) {
        this.pages.splice(index, 1);
    }
    protected downloadPage(index: number) {
        const page = this.pages[index];
        const data = this.createDocumentObjectBlob(index);
        const a = document.createElement('a');
        const url = URL.createObjectURL(data);
        a.href = url;
        a.download = `${page.info.name}.rath-dashboard`;
        a.click();
        requestAnimationFrame(() => {
            window.URL.revokeObjectURL(url);  
        });
    }
    protected setPageName(index: number, name: string) {
        this.pages[index].info.name = name;
        this.pages[index].info.lastModifyTime = Date.now();
    }
    protected setPageDesc(index: number, desc: string) {
        this.pages[index].info.description = desc;
        this.pages[index].info.lastModifyTime = Date.now();
    }
    protected addPageCard(index: number, layout: DashboardCard['layout']) {
        return this.pages[index].cards.push({
            layout,
            align: DashboardCardInsetLayout.Auto,
            content: {},
            config: {
                appearance: DashboardCardAppearance.Transparent,
            },
        });
    }
    protected movePageCard(pageIndex: number, index: number, x: number, y: number) {
        this.pages[pageIndex].cards[index].layout.x = x;
        this.pages[pageIndex].cards[index].layout.y = y;
    }
    protected resizePageCard(pageIndex: number, index: number, w: number, h: number) {
        this.pages[pageIndex].cards[index].layout.w = w;
        this.pages[pageIndex].cards[index].layout.h = h;
    }

    public setName(name: string) {
        this.name = name;
    }
    public setDesc(desc: string) {
        this.description = desc;
    }

    public fromPage(index: number): DashboardDocumentWithOperators {
        const page = this.pages[index];

        return {
            data: page,
            operators: {
                copy: this.copyPage.bind(this, index),
                remove: this.removePage.bind(this, index),
                download: this.downloadPage.bind(this, index),
                setName: this.setPageName.bind(this, index),
                setDesc: this.setPageDesc.bind(this, index),
                addCard: this.addPageCard.bind(this, index),
                moveCard: this.movePageCard.bind(this, index),
                resizeCard: this.resizePageCard.bind(this, index),
            },
        };
    }

    protected createDocumentObjectBlob(index: number): Blob {
        const page = this.pages[index];
        const storableState = DashboardStore.writeDocumentObjectBlob(page);
        return storableState;
    }

    public async loadDocumentObjectBlob(data: Blob): Promise<void> {
        const doc = await DashboardStore.readObjectBlob(data);
        runInAction(() => {
            this.pages.push(doc);
        });
    }

    protected readonly preview = new WeakMap<DashboardDocument, string>();

    public usePreview(index: number): string | undefined {
        const page = this.pages[index];
        if (!this.preview.has(page)) {
            // TODO:
            this.preview.set(page, '');
        }
        return this.preview.get(page);
    }

}
