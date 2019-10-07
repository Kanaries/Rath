import produce, { Draft } from 'immer';
import React, { useState, useMemo, createContext, useContext } from 'react';
import { DataSource, BIField } from './global';
export interface GlobalState {
  /**
   * `currentPage` is the current page number of visualization in explore board.
   */
  currentPage: number;
  /**
   * raw data is fetched and parsed data or uploaded data without any other changes.
   * computed value `dataSource` will be calculated 
   */
  rawData: DataSource;
  /**
   * fields contains fields with `dimension` or `measure` type.
   * currently, this kind of type is not computed property unlike 'quantitative', 'nominal'...
   * This is defined by user's purpose or domain knowledge.
   */
  fields: BIField[];

}

interface GlobalComputed {
  /**
   * `dataSource` is computed data based on fields' property(dimension or measure).
   * sometimes, uploaded data contains contains some measure field but they are parsed into string value, which is raw data.
   * dataSource transform these fields into what they should be for future computation.
   * This is usually happened when a csv file is uploaded.
   */
  dataSource: DataSource;
}
export type StateUpdater<S> = (draftState: Draft<S>) => void

// function createStore<S>(initState: S) {
//   const [state, setState] = useState<S>(initState)

//   return function useGlobalState(): [S, (stateUpdater: StateUpdater<S>) => void] {
//     const updateState = (stateUpdater: StateUpdater<S>) => {
//       const nextState = produce<S>(state, draftState => stateUpdater(draftState))
//       setState(nextState)
//     }
//     return [state, updateState]
//   }
// }

const initState: GlobalState = {
  currentPage: 0,
  fields: [],
  rawData: [],
};

const GloalStateContext = createContext<[GlobalState, (updater:StateUpdater<GlobalState>) => void]>(null!)

export function GlobalStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GlobalState>(initState)

  const updateState = (stateUpdater: StateUpdater<GlobalState>) => {
    const nextState = produce<GlobalState>(state, draftState => stateUpdater(draftState))
    setState(nextState)
  }

  return (
    <GloalStateContext.Provider value={[state, updateState]}>
      {children}
    </GloalStateContext.Provider>
  )
}
export function useGlobalState() {
  return useContext(GloalStateContext)
}