import { useEffect, useRef } from "react";

export type HotKeyLeadingKey = (
    | 'Meta'        // MacOS: command   Windows: Windows
    | 'Control'     // MacOS: control^  Windows: Ctrl
    | 'Shift'       // MacOS: shift     Windows: Shift
    | 'Alt'         // MacOS: option    Windows: Alt
);

export type HotKeyMainKey = (
    // | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0'
    | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K'
    | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V'
    | 'W' | 'X' | 'Y' | 'Z'
)

export type HotKeyTrigger = `${
    `${HotKeyLeadingKey}+` | ''
}${
    `${HotKeyLeadingKey}+` | ''
}${
    HotKeyMainKey
}`;

export type HotKeyCallback = (e: KeyboardEvent) => void;

export type HotKeyActions = {
    [key in HotKeyTrigger]?: HotKeyCallback;
};


const useHotKey = (actions: HotKeyActions) => {
    const actionsRef = useRef(actions);
    actionsRef.current = actions;

    useEffect(() => {
        const cb = (e: KeyboardEvent) => {
            const mainKey = /^Key(?<key>[A-Z])$/.exec(e.code)?.groups?.['key'] ?? null;
            if (mainKey) {
                const totalLeadingKey = [
                    e.metaKey ? 'Meta\\+' : '',
                    e.ctrlKey ? 'Control\\+' : '',
                    e.shiftKey ? 'Shift\\+' : '',
                    e.altKey ? 'Alt\\+' : '',
                ].filter(Boolean);
                const keyPattern = new RegExp(`^(${totalLeadingKey.join('|')})+${mainKey}$`);
                const matched = Object.entries(actionsRef.current).find(([k]) => keyPattern.test(k));
                matched?.[1](e);
            }
        };

        document.body.addEventListener('keydown', cb);

        return () => {
            document.body.removeEventListener('keydown', cb);
        };
    }, []);
};


export default useHotKey
