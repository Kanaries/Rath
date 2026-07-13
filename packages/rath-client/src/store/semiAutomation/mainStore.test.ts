jest.mock('../../services/index', () => ({
    labDistVisService: jest.fn(),
    loaEngineService: jest.fn(),
}));
jest.mock('../../queries/distVis', () => ({ distVis: jest.fn(() => ({})) }));
jest.mock('./autoVis', () => ({ autoVis: jest.fn(() => ({})) }));

import type { DataSourceStore } from '../dataSourceStore';
import { SemiAutomationStore } from './mainStore';
import { observable } from 'mobx';

describe('SemiAutomationStore lifecycle', () => {
    it('replaces its reactions instead of accumulating duplicates on init', () => {
        const dataSourceStore = observable({ cleanedData: [], fieldMetas: [] }) as unknown as DataSourceStore;
        const semiAutoStore = new SemiAutomationStore(dataSourceStore);
        const reactionCount = () => (semiAutoStore as unknown as { reactions: unknown[] }).reactions.length;

        semiAutoStore.init();
        expect(reactionCount()).toBe(3);

        semiAutoStore.init();
        expect(reactionCount()).toBe(3);

        semiAutoStore.clearStore();
    });
});
