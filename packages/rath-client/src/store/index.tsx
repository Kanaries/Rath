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
import { CausalStore as DeprecatedCausalStore } from './causalStore-old';
import CausalStore from './causalStore/mainStore';
export interface StoreCollection {
    langStore: LangStore;
    dataSourceStore: DataSourceStore;
    ltsPipeLineStore: LTSPipeLine;
    megaAutoStore: MegaAutomationStore;
    commonStore: CommonStore;
    clickHouseStore: ClickHouseStore;
    semiAutoStore: SemiAutomationStore;
    painterStore: PainterStore;
    collectionStore: CollectionStore;
    dashboardStore: DashboardStore;
    /** @deprecated */
    __deprecatedCausalStore: DeprecatedCausalStore;
    causalStore: CausalStore;
}

const langStore = new LangStore();
const commonStore = new CommonStore();
const dataSourceStore = new DataSourceStore();
const clickHouseStore = new ClickHouseStore();
const ltsPipeLineStore = new LTSPipeLine(dataSourceStore, commonStore, clickHouseStore);
const megaAutoStore = new MegaAutomationStore(ltsPipeLineStore);
const semiAutoStore = new SemiAutomationStore(dataSourceStore);
const painterStore = new PainterStore(commonStore, dataSourceStore, semiAutoStore);
const collectionStore = new CollectionStore(dataSourceStore);
const dashboardStore = new DashboardStore();
const __deprecatedCausalStore = new DeprecatedCausalStore(dataSourceStore);
const causalStore = new CausalStore(dataSourceStore);

const storeCol: StoreCollection = {
    commonStore,
    langStore,
    dataSourceStore,
    ltsPipeLineStore,
    megaAutoStore,
    clickHouseStore,
    semiAutoStore,
    painterStore,
    collectionStore,
    dashboardStore,
    __deprecatedCausalStore,
    causalStore,
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
