export type PrefetchType = 'audio' | 'document' | 'embed' | 'fetch' | 'font' | 'image' | 'object' | 'script' | 'style' | 'track' | 'video' | 'worker';

const memoizedPrefetch: Map<string, 1> = new Map<string, 1>();

const prefetch = (src: string, as: PrefetchType = 'image', importance: 'auto' | 'high' | 'low' = 'low'): void => {
    if (memoizedPrefetch.has(src)) {
        return;
    }

    const matchedPrefetchLink = document.querySelector(`link[rel=prefetch][href="${src}"]`);

    if (matchedPrefetchLink) {
        return;
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = src;
    link.as = as;
    (link as unknown as { importance: typeof importance }).importance = importance; // experimental attr
    document.head.appendChild(link);

    link.onload = () => {
        memoizedPrefetch.set(src, 1);
        link.remove();
    };

    link.onerror = () => {
        link.remove();
    };
};


export default prefetch;
