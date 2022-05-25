import { createContext, FC, useContext } from "react";
import { DataSourceStore } from "./dataSourceStore";

interface IGlobalStore {
    dataSourceStore: DataSourceStore;
}

const initStore: IGlobalStore = {
    dataSourceStore: new DataSourceStore()
}

const StoreContext = createContext<IGlobalStore>(initStore);

export const StoreWrapper: FC = props => {
    return <StoreContext.Provider value={initStore}>
        {props.children}
    </StoreContext.Provider>
}

export function useGlobalStore (): IGlobalStore {
    return useContext(StoreContext);
}