export const runtimeEnv = {
    mode: import.meta.env.MODE,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    expandEnv: import.meta.env.VITE_EXPAND_ENV ?? '',
} as const;

export function publicAssetUrl(path: string): string {
    return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
