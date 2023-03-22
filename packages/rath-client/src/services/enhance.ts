export function getEnhanceService (pathname: string) {
    const base = 'https://k6s-openai-enhance.vercel.app';
    return `${base}${pathname}`;
}