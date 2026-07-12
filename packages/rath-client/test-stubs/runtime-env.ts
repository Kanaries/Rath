export const runtimeEnv = {
    mode: 'test',
    isDevelopment: false,
    isProduction: false,
    expandEnv: '',
} as const;

export function publicAssetUrl(path: string): string {
    return `./${path.replace(/^\/+/, '')}`;
}
