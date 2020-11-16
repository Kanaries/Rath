import React, { useContext, useState, useCallback } from 'react';
import { DataSet } from '../interfaces';
import produce, { setAutoFreeze } from 'immer';
// import { getTitanicData } from '../data/titanic';
// import { getStudentsData } from '../data/students';
setAutoFreeze(false);
interface IGlobalState {
    dataBase: DataSet[];
    currentDBIndex: number;
}

export function getInitGState(): IGlobalState {
    return {
        dataBase: [
            // getStudentsData(),
            // getTitanicData()
        ],
        currentDBIndex: 0,
    };
}
type IUpdater<T> = (draft: T) => void;
const initState = getInitGState();
export const GlobalContext = React.createContext<[IGlobalState, (updater: IUpdater<IGlobalState>) => void]>(null!);

export function useLocalState() {
    return useContext(GlobalContext);
}

export const GlobalContextWrapper: React.FC = props => {
    const [gs, setGS] = useState<IGlobalState>(initState);
    const updateGlobalState = useCallback((updater: IUpdater<IGlobalState>) => {
        const nextState = produce<IGlobalState>(gs, updater);
        setGS(nextState);
    }, [gs])
    return <GlobalContext.Provider value={[gs, updateGlobalState]}>
        {
            props.children
        }
    </GlobalContext.Provider>
}