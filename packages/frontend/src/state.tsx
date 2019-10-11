import produce, { Draft } from 'immer';
import React, { useState, useMemo, createContext, useContext } from 'react';
import { DataSource, BIField } from './global';
import { Subspace } from './service';
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
  /**
   * dataSource been cleaned and grouped which is readly for exploration.
   */
  cookedDataSource: DataSource;
  cookedDimensions: string[];
  cookedMeasures: string[];
  /**
   * subspaceList is ordered list by it score.
   */
  // subspaceList: Subspace[]
  /**
   * loading status for some service
   * todo: 
   * manage the loading status in pages intead of globally.
   */
  loading: {
    univariateSummary: boolean;
    subspaceSearching: boolean;
  };
  
  topK: {
    /**
     * top k percent subspace it will fetch.
     */
    subspacePercentSize: number;
    dimensionSize: number;
  }

  subspaceList: Subspace[];
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
  cookedDataSource: [],
  cookedDimensions: [],
  cookedMeasures: [],
  loading: {
    univariateSummary: false,
    subspaceSearching: false
  },
  topK: {
    subspacePercentSize: 0.7,
    dimensionSize: 0.8
  },
  subspaceList: []
};

const GloalStateContext = createContext<[GlobalState, (updater:StateUpdater<GlobalState>) => void]>(null!)

export function GlobalStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GlobalState>(initState)

  const updateState = (stateUpdater: StateUpdater<GlobalState>) => {
    setState(state => {
      const nextState = produce<GlobalState>(state, draftState => stateUpdater(draftState))
      return nextState;
    })
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