import React, { useContext, useEffect } from 'react';
import { LangStore } from "./langStore";
import { GalleryStore } from './galleryStore'
import { DataSourceStore } from './dataSourceStore';
import { LitePipeStore } from './pipeLineStore/lite';
import { NoteBookStore } from './notebookStore';
import { DashBoardStore } from './dashboard';
import { LTSPipeLine } from './pipeLineStore/lts';
import { ExploreStore } from './exploreStore';

export interface StoreCollection {
    langStore: LangStore;
    galleryStore: GalleryStore;
    dataSourceStore: DataSourceStore;
    pipeLineStore: LitePipeStore;
    noteBookStore: NoteBookStore;
    dashBoardStore: DashBoardStore;
    ltsPipeLineStore: LTSPipeLine;
    exploreStore: ExploreStore;
}

const langStore = new LangStore();
const dataSourceStore = new DataSourceStore();
const litePipeStore = new LitePipeStore(dataSourceStore);
const ltsPipeLineStore = new LTSPipeLine(dataSourceStore);
const galleryStore = new GalleryStore(litePipeStore);
const noteBookStore = new NoteBookStore(litePipeStore);
const dashBoardStore = new DashBoardStore(litePipeStore);
const exploreStore = new ExploreStore(ltsPipeLineStore);

const storeCol: StoreCollection = {
    langStore,
    galleryStore,
    dataSourceStore,
    pipeLineStore: litePipeStore,
    noteBookStore,
    dashBoardStore,
    ltsPipeLineStore,
    exploreStore
}

const StoreContext = React.createContext<StoreCollection>(null!);

const StoreWrapper: React.FC = props => {
    useEffect(() => {
        return () => {
            storeCol.pipeLineStore.destroy();
        }
    }, [])
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
