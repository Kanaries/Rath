import React, { useContext } from 'react';
import { LangStore } from "./langStore";
import { CommonStore } from './commonStore';
import { DataSourceStore } from './dataSourceStore';
import { LTSPipeLine } from './pipeLineStore/lts';
import { MegaAutomationStore } from './megaAutomation';
import { ClickHouseStore } from './clickhouseStore';
import { SemiAutomationStore } from './semiAutomation/mainStore';
import { PainterStore } from './painterStore'
import { CollectionStore } from './collectionStore'
import DashboardStore from './dashboardStore';
import CausalStore from './causalStore/mainStore';
import UserStore from './userStore';
import { EditorStore } from './editorStore';
export interface StoreCollection {
    langStore: LangStore;
    dataSourceStore: DataSourceStore;
    ltsPipeLineStore: LTSPipeLine;
    megaAutoStore: MegaAutomationStore;
    commonStore: CommonStore;
    userStore: UserStore;
    clickHouseStore: ClickHouseStore;
    semiAutoStore: SemiAutomationStore;
    painterStore: PainterStore;
    collectionStore: CollectionStore;
    dashboardStore: DashboardStore;
    causalStore: CausalStore;
    editorStore: EditorStore;
}

const langStore = new LangStore();
const commonStore = new CommonStore();
const userStore = new UserStore();
const dataSourceStore = new DataSourceStore();
const clickHouseStore = new ClickHouseStore();
const ltsPipeLineStore = new LTSPipeLine(dataSourceStore, commonStore, clickHouseStore);
const megaAutoStore = new MegaAutomationStore(ltsPipeLineStore);
const semiAutoStore = new SemiAutomationStore(dataSourceStore);
const painterStore = new PainterStore(commonStore, dataSourceStore, semiAutoStore);
const collectionStore = new CollectionStore(dataSourceStore);
const dashboardStore = new DashboardStore();
const causalStore = new CausalStore(dataSourceStore);
const editorStore = new EditorStore();

const storeCol: StoreCollection = {
    commonStore,
    userStore,
    langStore,
    dataSourceStore,
    ltsPipeLineStore,
    megaAutoStore,
    clickHouseStore,
    semiAutoStore,
    painterStore,
    collectionStore,
    dashboardStore,
    causalStore,
    editorStore
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
