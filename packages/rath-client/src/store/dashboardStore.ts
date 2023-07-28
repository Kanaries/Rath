import { makeAutoObservable, runInAction, toJS } from "mobx";
import produce from "immer";
import type { IDashboardDocumentInfo, IDashboardFieldMeta, IFieldMeta, IFilter, IVegaSubset } from "../interfaces";
import { getGlobalStore } from ".";


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
    content: Partial<{
        title: string;
        text: string;
        chart: {
            subset: IVegaSubset;
            /** 图表自身数据的筛选器 */
            filters: IFilter[];
            /** 图表对其他所有图表数据的筛选器 */
            selectors: IFilter[];
        };
    }>;
    config: {
        /**
         * Appearance of cards.
         * @default DashboardCardAppearance.Transparent
         */
        appearance: DashboardCardAppearance;
        align: DashboardCardInsetLayout;
    };
};

export interface DashboardCardState extends DashboardCard {
    content: Partial<Required<DashboardCard['content']> & {
        chart: DashboardCard['content']['chart'] & {
            /* 这俩不要持久化 */
            /** 图表对全局所有图表高亮数据的筛选器 */
            highlighter: IFilter[];
            size: { w: number; h: number };
        };
    }>;
}

export interface DashboardDocument {
    version: number;
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
    /** All cards defined in the dashboard */
    cards: DashboardCardState[];
    config: {
        size: { w: number; h: number };
        filters: IFilter[];
    };
    meta: (IDashboardFieldMeta & { mapTo: string | null })[];
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
    removeCard: (index: number) => void;
    resizeCard: (index: number, w: number, h: number) => void;
    addDataFilter: (filter: IFilter) => void;
    removeDataFilter: (index: number) => void;
    fireUpdate: () => void;
}

export interface DashboardDocumentWithOperators {
    data: DashboardDocument;
    operators: Readonly<DashboardDocumentOperators>;
}

export default class DashboardStore {

    public static readonly rendererVersion = 1;

    protected static writeDocumentObjectBlob(data: DashboardDocument): Blob {
        // TODO: [enhance] optimize 
        // kyusho, 4 weeks ago   (November 1st, 2022 10:50 AM) 
        const part = JSON.stringify(data);
        const file = new Blob([ part ], { type: 'text/plain' });
        return file;
    }

    protected static async readObjectBlob(blob: Blob): Promise<DashboardDocument> {
        const text = await blob.text();
        // TODO: [enhance] optimize
        // kyusho, 4 weeks ago   (November 1st, 2022 10:50 AM) 
        const data = JSON.parse(text) as DashboardDocument;
        return data;
    }

    public name: string;
    public description: string;
    public pages: DashboardDocument[];

    constructor() {
        makeAutoObservable(this);
        this.name = 'My Dashboard List';
        this.description = '';
        this.pages = [];
    }

    public newPage() {
        const { dataSourceStore } = getGlobalStore();
        const now = Date.now();
        this.pages.push({
            version: DashboardStore.rendererVersion,
            info: {
                name: 'New Dashboard',
                description: '',
                createTime: now,
                lastModifyTime: now,
            },
            data: {
                source: dataSourceStore.datasetId ?? 'context dataset',
                filters: [],
            },
            cards: [],
            config: {
                size: {
                    w: 256,
                    h: 256,
                },
                filters: [],
            },
            meta: [],
        });
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
    }
    protected setPageDesc(index: number, desc: string) {
        this.pages[index].info.description = desc;
    }
    protected addPageCard(index: number, layout: DashboardCard['layout']) {
        return this.pages[index].cards.push({
            layout,
            content: {},
            config: {
                appearance: DashboardCardAppearance.Transparent,
                align: DashboardCardInsetLayout.Column,
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
    protected removePageCard(pageIndex: number, index: number) {
        this.pages[pageIndex].cards.splice(index, 1);
    }
    protected addPageDataFilter(pageIndex: number, filter: IFilter) {
        this.pages[pageIndex].config.filters.push(filter);
    }
    protected removeDataFilter(pageIndex: number, index: number) {
        this.pages[pageIndex].config.filters.splice(index, 1);
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
                removeCard: this.removePageCard.bind(this, index),
                addDataFilter: this.addPageDataFilter.bind(this, index),
                removeDataFilter: this.removeDataFilter.bind(this, index),
                fireUpdate: () => this.pages[index].info.lastModifyTime = Date.now(),
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

    public save() {
        const data = this.pages.map<Omit<DashboardDocument, 'cards'> & { cards: DashboardCard[] }>(page => produce(toJS(page), draft => {
            for (const card of draft.cards) {
                if (card.content.chart) {
                    (card.content as { chart: DashboardCard['content']['chart'] }).chart = {
                        subset: card.content.chart.subset,
                        filters: card.content.chart.filters,
                        selectors: card.content.chart.selectors,
                    };
                }
            }
        }));
        return {
            name: this.name,
            description: this.description,
            data,
        };
    }

    public loadAll(data: ReturnType<typeof this.save>) {
        this.name = data.name;
        this.description = data.description;
        this.pages = data.data.map(page => produce(page as DashboardDocument, draft => {
            for (const card of draft.cards) {
                if (card.content.chart) {
                    card.content.chart.highlighter = [];
                    card.content.chart.size = { w: 1, h: 1 };
                }
            }
        }));
    }

    public loadPage(page: ReturnType<typeof this.save>['data'][number], config: IDashboardDocumentInfo) {
        this.pages.push(produce(page as DashboardDocument, draft => {
            for (const card of draft.cards) {
                if (card.content.chart) {
                    card.content.chart.highlighter = [];
                    card.content.chart.size = { w: 1, h: 1 };
                }
            }
            draft.meta = config.meta.map(f => ({
                ...f,
                mapTo: null,
            }));
        }));
    }

    public mapField(pageIdx: number, id: string, mapTo: string | null): boolean {
        const page = this.pages[pageIdx];
        const field = page.meta.find(which => which.fId === id);
        if (!field) {
            return false;
        }
        const prev = field.mapTo ?? field.fId;
        field.mapTo = mapTo;
        for (const { content: { chart } } of page.cards) {
            if (chart) {
                chart.filters = chart.filters.reduce<typeof chart.filters>((list, filter) => {
                    if (filter.fid === prev) {
                        filter.fid = mapTo ?? '';
                    }
                    list.push(filter);
                    return list;
                }, []);
                chart.highlighter = [];
                chart.selectors = chart.selectors.reduce<typeof chart.selectors>((list, filter) => {
                    if (filter.fid === prev) {
                        if (mapTo) {
                            filter.fid = mapTo;
                            list.push(filter);
                        }
                    } else {
                        list.push(filter);
                    }
                    return list;
                }, []);
                for (const channel of Object.values(chart.subset.encoding)) {
                    if (channel.field === prev) {
                        channel.field = mapTo ?? '';
                    }
                }
            }
        }
        return true;
    }

    /**
     * 涉及到适合使用 mobx runInAction 处理的场景，改写为这个方法，以方便在这个 store 中进行追踪
     * @param updater change any state in store as an action
     */
    public runInAction(updater: () => void): void {
        updater();
    }

}
