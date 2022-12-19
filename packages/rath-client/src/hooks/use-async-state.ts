import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Subject, switchAll } from 'rxjs';


const useAsyncState = <S>(fallback: S): [S, Dispatch<SetStateAction<S | Promise<S>>>] => {
    const [state, setState] = useState(fallback);
    
    const fallbackRef = useRef(fallback);
    fallbackRef.current = fallback;
    const stateRef = useRef(state);
    stateRef.current = state;

    const asyncState$ = useMemo(() => new Subject<Promise<S>>(), []);

    useEffect(() => {
        const subscription = asyncState$.pipe(switchAll()).subscribe(data => setState(data));
        return () => {
            subscription.unsubscribe();
        };
    }, [asyncState$]);

    const action = useCallback<Dispatch<SetStateAction<S | Promise<S>>>>((next) => {
        setState(fallbackRef.current);
        const nextState = typeof next === 'function' ? (next as ((prevState: S) => S))(stateRef.current) : next;
        if (nextState instanceof Promise) {
            asyncState$.next(nextState);
        } else {
            setState(nextState);
        }
    }, [asyncState$]);

    return [state, action];
};


export default useAsyncState;
