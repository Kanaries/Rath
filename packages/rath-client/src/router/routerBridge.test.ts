import { isPivotKey, readRouteKeyFromHash, toNavHash } from '../router/routerBridge';
import { PIVOT_KEYS } from '../constants';

describe('routerBridge', () => {
    const originalHash = window.location.hash;

    afterEach(() => {
        window.location.hash = originalHash;
    });

    it('reads legacy and slash-prefixed hashes', () => {
        window.location.hash = '#megaAuto';
        expect(readRouteKeyFromHash()).toBe(PIVOT_KEYS.megaAuto);

        window.location.hash = '#/dataSource';
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
