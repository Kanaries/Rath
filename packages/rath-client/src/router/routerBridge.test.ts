import { isPivotKey, readRouteKeyFromHash, toNavHash } from '../router/routerBridge';
import { PIVOT_KEYS } from '../constants';

describe('routerBridge', () => {
    const originalWindow = globalThis.window;

    afterEach(() => {
        Object.defineProperty(globalThis, 'window', {
            configurable: true,
            value: originalWindow,
        });
    });

    function mockHash(hash: string) {
        Object.defineProperty(globalThis, 'window', {
            configurable: true,
            value: {
                location: { hash },
            },
        });
    }

    it('reads legacy and slash-prefixed hashes', () => {
        mockHash('#megaAuto');
        expect(readRouteKeyFromHash()).toBe(PIVOT_KEYS.megaAuto);

        mockHash('#/dataSource');
        expect(readRouteKeyFromHash()).toBe(PIVOT_KEYS.dataSource);
    });

    it('validates pivot keys', () => {
        expect(isPivotKey(PIVOT_KEYS.causal)).toBe(true);
        expect(isPivotKey('not-a-page')).toBe(false);
    });

    it('builds nav hash with slash prefix', () => {
        expect(toNavHash(PIVOT_KEYS.dashboard)).toBe('#/dashboard');
    });
});
