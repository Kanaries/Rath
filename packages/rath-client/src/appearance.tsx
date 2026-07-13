import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

export type Appearance = 'light' | 'dark' | 'system';
export type ResolvedAppearance = Exclude<Appearance, 'system'>;

export const APPEARANCE_STORAGE_KEY = 'rath:appearance';
export const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)';

interface AppearanceContextValue {
    appearance: Appearance;
    resolvedAppearance: ResolvedAppearance;
    setAppearance: (appearance: Appearance) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function isAppearance(value: string | null): value is Appearance {
    return value === 'light' || value === 'dark' || value === 'system';
}

export function getStoredAppearance(storage: Pick<Storage, 'getItem'> | undefined = typeof window === 'undefined' ? undefined : window.localStorage): Appearance {
    try {
        const stored = storage?.getItem(APPEARANCE_STORAGE_KEY) ?? null;
        return isAppearance(stored) ? stored : 'system';
    } catch {
        return 'system';
    }
}

export function resolveAppearance(appearance: Appearance, systemPrefersDark: boolean): ResolvedAppearance {
    return appearance === 'system' ? (systemPrefersDark ? 'dark' : 'light') : appearance;
}

export function applyAppearance(appearance: Appearance, resolvedAppearance: ResolvedAppearance): void {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedAppearance === 'dark');
    root.dataset.appearance = appearance;
    root.dataset.theme = resolvedAppearance;
    root.style.colorScheme = resolvedAppearance;

    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    themeColor?.setAttribute('content', resolvedAppearance === 'dark' ? '#0f0f0f' : '#ffffff');
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
    const [appearance, setAppearanceState] = useState<Appearance>(getStoredAppearance);
    const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
        typeof window === 'undefined' ? false : window.matchMedia(SYSTEM_DARK_QUERY).matches
    );
    const resolvedAppearance = resolveAppearance(appearance, systemPrefersDark);

    useEffect(() => {
        const media = window.matchMedia(SYSTEM_DARK_QUERY);
        const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
        setSystemPrefersDark(media.matches);
        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, []);

    useIsomorphicLayoutEffect(() => {
        applyAppearance(appearance, resolvedAppearance);
    }, [appearance, resolvedAppearance]);

    const value = useMemo<AppearanceContextValue>(
        () => ({
            appearance,
            resolvedAppearance,
            setAppearance(nextAppearance) {
                setAppearanceState(nextAppearance);
                try {
                    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, nextAppearance);
                } catch {
                    // The appearance still applies for this session when storage is unavailable.
                }
            },
        }),
        [appearance, resolvedAppearance]
    );

    return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
    const context = useContext(AppearanceContext);
    if (!context) throw new Error('useAppearance must be used inside AppearanceProvider.');
    return context;
}
