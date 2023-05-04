import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";


export const useCachedState = <S extends string>(key: string, initialValue: S): [
    S, Dispatch<SetStateAction<S>>
] => {
    const [state, setState] = useState(initialValue);

    const keyRef = useRef(key);

    useEffect(() => {
        const item = localStorage.getItem(keyRef.current);
        if (item) {
            setState(item as S);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(key, state);
    }, [key, state]);

    return [state, setState];
};


export default useCachedState;
