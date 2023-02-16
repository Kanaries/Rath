import { useCallback, useRef, useState, useEffect, Dispatch } from 'react';


export type AsyncDispatch<A> = (value: A) => Promise<A>;

export interface AsyncDispatchRejectEvent<T> {
    reason: unknown;
    fallbackToInitState: () => void;
    fallbackToPrevState: () => void;
    fallbackTo: Dispatch<T | (() => T)>;
}

export type AsyncStateOption<T> = {
    /** @default true */
    resetBeforeTask?: boolean;
    onReject?: (event: AsyncDispatchRejectEvent<T>) => void;
};

const defaultRejectHandler = (event: AsyncDispatchRejectEvent<any>): void => {
    const { reason } = event;
    throw reason instanceof Error ? reason : new Error(`Uncaught rejection: ${reason}`);
};

const useAsyncState = <T>(
    initState: T | (() => T),
    option: AsyncStateOption<T> = {},
): [T, AsyncDispatch<T | Promise<T> | ((prevState: T) => T | Promise<T>)>, boolean] => {
    const optionRef = useRef(option);
    const initializerRef = useRef(initState);
    const [asyncState, setAsyncState] = useState<T>(initState);
    const [loading, setLoading] = useState(false);
    const unmountedRef = useRef(false);

    const lastSettledStateRef = useRef(asyncState);

    const pendingRef = useRef<Promise<T> | null>(null);

    const dispatcher = useCallback<AsyncDispatch<T | Promise<T> | ((prevState: T) => T | Promise<T>)>>(next => {
        if (unmountedRef.current) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Warning: Can\'t perform a React state update on an unmounted component.');
            }
            return new Promise<T>(() => void 0);
        }
        const {
            resetBeforeTask = true,
            onReject = defaultRejectHandler,
        } = optionRef.current;

        const value = typeof next === 'function' ? (next as (prevState: T) => T | Promise<T>)(lastSettledStateRef.current) : next;

        return new Promise<T>(resolve => {
            if (value instanceof Promise) {
                if (resetBeforeTask) {
                    setAsyncState(initializerRef.current);
                }
                pendingRef.current = value;
                setLoading(true);
                value.then(res => {
                    if (pendingRef.current === value && !unmountedRef.current) {
                        pendingRef.current = null;
                        setAsyncState(res);
                        lastSettledStateRef.current = res;
                        setLoading(false);
                        resolve(res);
                    }
                }).catch(reason => {
                    if (pendingRef.current === value && !unmountedRef.current) {
                        pendingRef.current = null;
                        onReject({
                            reason,
                            fallbackToInitState() {
                                setAsyncState(initializerRef.current);
                            },
                            fallbackToPrevState() {
                                setAsyncState(lastSettledStateRef.current);
                            },
                            fallbackTo(next) {
                                setAsyncState(next);
                            },
                        });
                        setLoading(false);
                    }
                });
            } else {
                setAsyncState(value);
                lastSettledStateRef.current = value;
                resolve(value);
            }
        });
    }, []);

    useEffect(() => {
        unmountedRef.current = false;
        return () => {
            pendingRef.current = null;
            unmountedRef.current = true;
        };
    }, []);

    return [asyncState, dispatcher, loading];
};


export default useAsyncState;
