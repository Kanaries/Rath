import type { NavigateFunction } from 'react-router-dom';
import { PIVOT_KEYS } from '../constants';

const PIVOT_KEY_VALUES = new Set<string>(Object.values(PIVOT_KEYS));

export function isPivotKey(key: string): key is typeof PIVOT_KEYS[keyof typeof PIVOT_KEYS] {
    return PIVOT_KEY_VALUES.has(key);
}

let navigateRef: NavigateFunction | null = null;

export function setRouterNavigate(navigate: NavigateFunction | null) {
    navigateRef = navigate;
}

export function navigateToRoute(key: string, options?: { replace?: boolean }) {
    if (!isPivotKey(key)) return;
    if (navigateRef) {
        navigateRef(`/${key}`, { replace: options?.replace ?? true });
        return;
    }
    if (typeof window !== 'undefined') {
        const newHash = `#/${key}`;
        if (window.location.hash !== newHash && window.location.hash !== `#${key}`) {
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${newHash}`);
        }
    }
}

export function readRouteKeyFromHash(): string | null {
    if (typeof window === 'undefined') return null;
    const key = window.location.hash.replace(/^#\/?/, '').split('?')[0].trim();
    return key && isPivotKey(key) ? key : null;
}

export function toNavHash(key: string): string {
    return `#/${key}`;
}
