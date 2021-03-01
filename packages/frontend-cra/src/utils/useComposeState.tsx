import { useState, useCallback } from 'react';
import produce, { Draft } from 'immer';
/**
 * @param S type of the composed state
 */
export type StateUpdater<S> = (draftState: Draft<S>) => void
/**
 * 
 * @param initState
 * useComposeState helps you manage several state together, provided with immutable state change api
 * 
 * example:
 * ```js
 * const [state, setState] = useComposeState({foo: 12, bar: { foo: 20}})
 * setState(draft => {
 *  draft.bar.foo = 100;
 * })
 * ```
 */
export default function useComposeState<S>(initState: S): [S, (stateUpdater: StateUpdater<S>) => void] {
  const [state, setState] = useState<S>(initState)
  const updateState = useCallback((stateUpdater: StateUpdater<S>) => {
    setState(state => {
      const nextState = produce<S>(state, draftState => stateUpdater(draftState))
      return nextState
    })
  }, [setState])
  return [state, updateState]
}