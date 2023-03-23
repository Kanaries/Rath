export function getEnhanceService (pathname: string) {
    const base = 'https://enhanceai.kanaries.net';
    // const base = 'http://localhost:2023'
    return `${base}${pathname}`;
}