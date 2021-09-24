import React, { useContext, useEffect } from 'react';
import { CommonStore } from './commonStore'
import { VizSpecStore } from './visualSpecStore'

interface GlobalStore {
    commonStore: CommonStore;
    vizStore: VizSpecStore;
}

const commonStore = new CommonStore();
const vizStore = new VizSpecStore(commonStore);

const initStore: GlobalStore = {
    commonStore,
    vizStore
}

const StoreContext = React.createContext<GlobalStore>(initStore);

export const StoreWrapper: React.FC = props => {
    useEffect(() => {
        return () => {
            initStore.vizStore.destroy();
            initStore.commonStore.destroy();
        }
    }, [])
    return <StoreContext.Provider value={initStore}>
        { props.children }
    </StoreContext.Provider>
}

export function useGlobalStore() {
    return useContext(StoreContext);
}
