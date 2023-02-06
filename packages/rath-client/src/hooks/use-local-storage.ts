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

const setStorageItem = <S>(key: string, value: S, virtual: boolean): void => {
    if (virtual) {
        virtualStorage[key] = value;
    } else {
        localStorage.setItem(key, JSON.stringify(value));
    }

    fireUpdate(key, virtual);
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
    /** 当该字段已存在一个值时，是否继续为它赋值，默认为 false */
    forceAssign?: boolean;
    /** 当值为 true 时，不修改或读取 localStorage，而是仅存储在内存中，默认为 false */
    virtual?: boolean;
}

/**
 * hook：订阅并使用 localStorage，返回对应的值和 setter.
 *
 * @template S 字段值类型
 * @template RS
 * @param {string} name 字段名，仅在首次执行时生效
 * @param {RS} initValue 字段的初始值，仅在首次执行时生效
 * @param {UseLocalStoreOption} [option={}] 额外设置项，仅在首次执行时生效
 * @returns {[RS, LocalStorageSetter<RS>]} 当前值和 setter
 */
const useLocalStorage = <S, RS extends S extends object ? Readonly<S> : S = S extends object ? Readonly<S> : S>(
    name: string,
    initValue: RS,
    option: UseLocalStoreOption = {}
): [
        RS, LocalStorageSetter<RS>
    ] => {
    /** 字段名，不更新 */
    const keyRef = useRef(name);

    /* 生效的 option，不更新 */
    const forceAssignRef = useRef(option.forceAssign ?? false);
    const virtualRef = useRef(option.virtual ?? false);

    /** 用于初始化的默认值，不更新 */
    const { current: defaultState } = useRef(((): RS => {
        if (!hasStorageItem(keyRef.current, virtualRef.current) || forceAssignRef.current) {
            setStorageItem(keyRef.current, initValue, virtualRef.current);
        }
        return getStorageItem(keyRef.current, virtualRef.current) as RS;
    })());

    // 使用 useState 管理状态更新
    const [state, setState] = useState<RS>(defaultState);

    // 注册状态更新
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

    /** 返回的 setter：传值更新 localStorage，然后触发更新 */
    const setter = useCallback((s: RS) => {
        return setStorageItem(keyRef.current, s, virtualRef.current);
    }, []);

    return [state, setter];
};


export default useLocalStorage;
