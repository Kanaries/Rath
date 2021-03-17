import { makeAutoObservable } from 'mobx'
import { ViewSpace } from '../../service';
import { globalRef } from '../../global';
import { recallLogger } from '../../loggers/recall';

export class GalleryStore {
    public likes: Set<number> = new Set();
    public currentPage: number = 0;
    public showAssociation: boolean = false;
    public showConfigPanel: boolean = false;
    public viewSpaces: ViewSpace[] = [];
    
    constructor () {
        makeAutoObservable(this);
    }

    public get currentViewSpace () {
        return this.viewSpaces[this.currentPage];
    }

    public init () {
        this.likes = new Set();
        this.currentPage = 0;
    }
    public clearLikes () {
        this.likes = new Set();
    }

    public async likeIt (index: number, spec: any) {
        this.likes.add(index);
        recallLogger({
            index,
            total: this.viewSpaces.length,
            spec,
            vegaSpec: globalRef.baseVisSpec
        });
    }
    public setViewSpaces (viewSpaces: ViewSpace[]) {
        this.viewSpaces = viewSpaces;
    }
    public goToPage (pageNo: number) {
        this.currentPage = pageNo;
    }
    public nextPage () {
        this.currentPage = (this.currentPage + 1) % this.viewSpaces.length;
    }
    public lastPage () {
        this.currentPage = (this.currentPage - 1 + this.viewSpaces.length) % this.viewSpaces.length;
    }
}

const storeRef = {
    store: new GalleryStore()
}

export function useGalleryStore () {
    // const store = useMemo<GalleryStore>(() => {
    //     return new GalleryStore();
    // }, [])
    // return store;
    return storeRef.store
}