import { RefObject, useEffect, useRef, useState } from "react";


export type BoundingClientRectAttributes = {
    /** @default true */
    -readonly [key in keyof Omit<DOMRect, 'toJSON'>]?: boolean;
};

/**
 * Updates on certain keys of DOMRect changes, detected using `ResizeObserver`.
 * DISCUSS: use `IntersectionObserver` with ref elements to implements position changes.
 */
const useBoundingClientRect = <
    T extends BoundingClientRectAttributes = { -readonly [key in keyof Omit<DOMRect, 'toJSON'>]: true },
    M extends { -readonly [key in keyof Omit<DOMRect, 'toJSON'>]: T[key] extends true ? key : never } = { -readonly [key in keyof Omit<DOMRect, 'toJSON'>]: T[key] extends true ? key : never },
    E extends Exclude<M[keyof M], never> & keyof DOMRect = Exclude<M[keyof M], never> & keyof DOMRect,
    R extends { readonly [key in E]?: DOMRect[key] } = { readonly [key in E]?: DOMRect[key] },
>(
    ref: RefObject<HTMLElement>,
    /** @default {height:true,width:true,x:true,y:true,bottom:true,left:true,right:true,top:true} */
    attributes: T = {
        height: true,
        width: true,
        x: true,
        y: true,
        bottom: true,
        left: true,
        right: true,
        top: true,
    } as T,
): R => {
    const compareKeysRef = useRef<(keyof BoundingClientRectAttributes)[]>([]);
    compareKeysRef.current = (["height", "width", "x", "y", "bottom", "left", "right", "top"] as const).filter(key => {
        return attributes[key] === true;
    });

    const [box, setBox] = useState<R>({} as R);

    const prevRectRef = useRef<DOMRect>();
    const shouldReportRef = useRef<(next: DOMRect) => boolean>(() => true);
    shouldReportRef.current = (next: DOMRect): boolean => {
        return !prevRectRef.current || compareKeysRef.current.some(k => next[k] !== prevRectRef.current![k]);
    };

    useEffect(() => {
        const { current: element } = ref;

        if (element) {
            const cb = () => {
                const rect = element.getBoundingClientRect();
                if (shouldReportRef.current(rect)) {
                    setBox(Object.fromEntries(compareKeysRef.current.map(key => [key, rect[key]])) as R);
                }
                prevRectRef.current = rect;
            };
            const ro = new ResizeObserver(cb);
            ro.observe(element);
            cb();
            return () => {
                ro.disconnect();
            };
        }
    }, [ref]);

    return box;
};


export default useBoundingClientRect;
