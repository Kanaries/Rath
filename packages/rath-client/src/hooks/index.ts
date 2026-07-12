import { useState, useCallback, useMemo } from 'react';
import produce, { Draft } from 'immer';
import intl from 'react-intl-universal';
import { CleanMethod } from '../interfaces';

/**
 * @param S type of the composed state
 */
export type StateUpdater<S> = (draftState: Draft<S>) => void;
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
export function useComposeState<S>(initState: S): [S, (stateUpdater: StateUpdater<S>) => void] {
    const [state, setState] = useState<S>(initState);
    const updateState = useCallback(
        (stateUpdater: StateUpdater<S>) => {
            setState((state) => {
                const nextState = produce<S>(state, (draftState) => stateUpdater(draftState));
                return nextState;
            });
        },
        [setState]
    );
    return [state, updateState];
}

export const cleanMethodList: Array<{ key: CleanMethod; text: string }> = [
    { key: 'dropNull', text: 'drop null records' },
    { key: 'useMode', text: 'replace null with mode' },
    { key: 'simpleClean', text: 'simple cleaning' },
    { key: 'none', text: 'none' },
];

export const useCleanMethodList = function (): typeof cleanMethodList {
    return useMemo(() => {
        return cleanMethodList.map((m) => {
            return {
                key: m.key,
                text: intl.get(`dataSource.methods.${m.key}`),
            };
        });
    }, []);
};
