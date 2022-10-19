import React, { useContext, useEffect } from 'react';
import { LangStore } from "./langStore";
import { CommonStore } from './commonStore';
import { GalleryStore } from './galleryStore'
import { DataSourceStore } from './dataSourceStore';
import { LitePipeStore } from './pipeLineStore/lite';
import { NoteBookStore } from './notebookStore';
import { DashBoardStore } from './dashboard';
import { LTSPipeLine } from './pipeLineStore/lts';
import { MegaAutomationStore } from './megaAutomation';
import { ClickHouseStore } from './clickhouseStore';
import { SemiAutomationStore } from './semiAutomation/mainStore';
import { PainterStore } from './painterStore'
import { CollectionStore } from './collectionStore'
export interface StoreCollection {
    langStore: LangStore;
    galleryStore: GalleryStore;
    dataSourceStore: DataSourceStore;
    pipeLineStore: LitePipeStore;
    noteBookStore: NoteBookStore;
    dashBoardStore: DashBoardStore;
    ltsPipeLineStore: LTSPipeLine;
    megaAutoStore: MegaAutomationStore;
    commonStore: CommonStore;
    clickHouseStore: ClickHouseStore;
    semiAutoStore: SemiAutomationStore;
    painterStore: PainterStore;
    collectionStore: CollectionStore;
}

const langStore = new LangStore();
const commonStore = new CommonStore();
const dataSourceStore = new DataSourceStore();
const clickHouseStore = new ClickHouseStore();
const litePipeStore = new LitePipeStore(dataSourceStore);
const ltsPipeLineStore = new LTSPipeLine(dataSourceStore, commonStore, clickHouseStore);
const galleryStore = new GalleryStore(litePipeStore);
const noteBookStore = new NoteBookStore(litePipeStore);
const dashBoardStore = new DashBoardStore(litePipeStore);
const megaAutoStore = new MegaAutomationStore(ltsPipeLineStore);
const semiAutoStore = new SemiAutomationStore(dataSourceStore);
const painterStore = new PainterStore();
const collectionStore = new CollectionStore(dataSourceStore);

const storeCol: StoreCollection = {
    commonStore,
    langStore,
    galleryStore,
    dataSourceStore,
    pipeLineStore: litePipeStore,
    noteBookStore,
    dashBoardStore,
    ltsPipeLineStore,
    megaAutoStore,
    clickHouseStore,
    semiAutoStore,
    painterStore,
    collectionStore
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
