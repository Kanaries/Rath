import { getStoredAppearance, resolveAppearance } from './appearance';

describe('appearance', () => {
    it('defaults to system and accepts all supported stored modes', () => {
        expect(getStoredAppearance({ getItem: () => null })).toBe('system');
        expect(getStoredAppearance({ getItem: () => 'invalid' })).toBe('system');
        expect(getStoredAppearance({ getItem: () => 'light' })).toBe('light');
        expect(getStoredAppearance({ getItem: () => 'dark' })).toBe('dark');
        expect(getStoredAppearance({ getItem: () => 'system' })).toBe('system');
    });

    it('resolves system mode and leaves explicit modes unchanged', () => {
        expect(resolveAppearance('system', false)).toBe('light');
        expect(resolveAppearance('system', true)).toBe('dark');
        expect(resolveAppearance('light', true)).toBe('light');
        expect(resolveAppearance('dark', false)).toBe('dark');
    });
});
