import { makeAutoObservable } from 'mobx'
import { globalRef } from '../../global';
import { recallLogger } from '../../loggers/recall';

export class GalleryStore {
    public likes: Set<number> = new Set();
    constructor () {
        makeAutoObservable(this);
    }
    public clearLikes () {
        this.likes = new Set();
    }
    public async likeIt (index: number, total: number, spec: any) {
        this.likes.add(index);
        recallLogger({
            index,
            total,
            spec,
            vegaSpec: globalRef.baseVisSpec
        });
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