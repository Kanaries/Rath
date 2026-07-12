import { runtimeEnv } from 'runtime-env';

export function checkExpandEnv(): string {
    if (typeof window === 'object') {
        const url = new URL(window.location.href).searchParams.get('expand');
        if (url) {
            (window as any).ExpandEnv = url;
            return url;
        } else return '';
    }
    if (runtimeEnv.expandEnv) return runtimeEnv.expandEnv;
    else return '';
}
