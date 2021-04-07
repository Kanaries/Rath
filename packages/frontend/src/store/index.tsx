import React, { useContext } from 'react';
import { LangStore } from "./langStore";
import { GalleryStore } from './galleryStore'

export interface StoreCollection {
    langStore: LangStore;
    galleryStore: GalleryStore;
}

const storeCol: StoreCollection = {
    langStore: new LangStore(),
    galleryStore: new GalleryStore()
}

const StoreContext = React.createContext<StoreCollection>(null!);

const StoreWrapper: React.FC = props => {
    return <StoreContext.Provider value={storeCol}>
        { props.children }
    </StoreContext.Provider>
}

export function useGlobalStore () {
    return useContext(StoreContext)
}

export function getGlobalStore() {
    return storeCol
}

export { StoreWrapper }
