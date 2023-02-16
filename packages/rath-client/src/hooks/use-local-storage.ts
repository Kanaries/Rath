import { useState, useRef, useEffect, useCallback } from 'react';


export type LocalStorageSetter<S> = (val: S) => void;

const virtualStorage: {
    [name: string]: any;
} = {};

const listeners: {
    [name: string]: (() => void)[];
} = {};

const virtualListeners: {
    [name: string]: (() => void)[];
} = {};

const hasStorageItem = (key: string, virtual: boolean): boolean => {
    return virtual ? key in virtualStorage : localStorage.getItem(key) !== null;
};

const getStorageItem = <S>(key: string, virtual: boolean): S => {
    return virtual ? virtualStorage[key] as S : JSON.parse(
        localStorage.getItem(key) as string
    ) as S;
};

const updateQueue: (() => void)[] = [];
let dirty = false;
const BATCH_SPAN = 100;

const batchUpdate = () => {
    if (dirty || updateQueue.length === 0) {
        return;
    }

    dirty = true;

    setTimeout(() => {
        updateQueue.forEach(cb => cb());
        updateQueue.splice(0, updateQueue.length);
        dirty = false;
    }, BATCH_SPAN);
};

const fireUpdate = (key: string, virtual: boolean): void => {
    const cbs = virtual ? virtualListeners : listeners;

    for (const cb of cbs[key] ?? []) {
        cb();
    }

    batchUpdate();
};

const setStorageItem = <S>(key: string, value: S, virtual: boolean, noFire = false): void => {
    if (virtual) {
        virtualStorage[key] = value;
    } else {
        localStorage.setItem(key, JSON.stringify(value));
    }

    if (!noFire) {
        fireUpdate(key, virtual);
    }
};

const subscribe = (key: string, cb: () => void, virtual: boolean): void => {
    if (virtual) {
        virtualListeners[key] = [
            ...(virtualListeners[key] ?? []),
            cb,
        ];
    } else {
        listeners[key] = [
            ...(listeners[key] ?? []),
            cb,
        ];
    }
};

const unsubscribe = (key: string, cb: () => void, virtual: boolean): void => {
    if (virtual) {
        virtualListeners[key] = (virtualListeners[key] ?? []).filter(e => e !== cb);
    } else {
        listeners[key] = (listeners[key] ?? []).filter(e => e !== cb);
    }
};

export interface UseLocalStoreOption {
    /**
     * whether to assign the initial value when this key already exists in the storage.
     * @default false
     */
    forceAssign?: boolean;
    /**
     * whether to store data in memory instead of localStorage.
     * @default false
     */
    virtual?: boolean;
}

/**
 * @template S type of the state value
 * @template RS
 * @param {string} name key of the storage, works only in first call
 * @param {RS} initValue initial value, works only in first call
 * @param {UseLocalStoreOption} [option={}] options, works only in first call
 * @returns {[RS, LocalStorageSetter<RS>]} current value and setter
 */
const useLocalStorage = <S, RS extends S extends object ? Readonly<S> : S = S extends object ? Readonly<S> : S>(
    name: string,
    initValue: RS,
    option: UseLocalStoreOption = {}
): [
        RS, LocalStorageSetter<RS>
    ] => {
    const keyRef = useRef(name);

    const forceAssignRef = useRef(option.forceAssign ?? false);
    const virtualRef = useRef(option.virtual ?? false);

    const { current: defaultState } = useRef(((): RS => {
        if (!hasStorageItem(keyRef.current, virtualRef.current) || forceAssignRef.current) {
            setStorageItem(keyRef.current, initValue, virtualRef.current, true);
        }
        return getStorageItem(keyRef.current, virtualRef.current) as RS;
    })());

    const [state, setState] = useState<RS>(defaultState);

    useEffect(() => {
        const key = keyRef.current;
        const virtual = virtualRef.current;

        const cb = () => {
            setState(getStorageItem<RS>(key, virtual));
        };

        subscribe(key, cb, virtual);

        return () => {
            unsubscribe(key, cb, virtual);
        };
    });

    const setter = useCallback((s: RS) => {
        return setStorageItem(keyRef.current, s, virtualRef.current);
    }, []);

    return [state, setter];
};


export default useLocalStorage;
