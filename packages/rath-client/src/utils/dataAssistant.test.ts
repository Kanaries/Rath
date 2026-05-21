import { PIVOT_KEYS } from '../constants';
import type { IFieldMeta } from '../interfaces';
import {
    parseDataQuestion,
    pickNarrativeFields,
} from './dataAssistant';
import {
    buildShareableWorkflowUrl,
    createWorkflowSnapshot,
    decodeWorkflowQuery,
    encodeWorkflowQuery,
    importWorkflowSession,
} from './workflowSession';

describe('parseDataQuestion', () => {
    const fields = [
        { fid: 'revenue', name: 'Revenue', semanticType: 'quantitative', analyticType: 'measure' },
        { fid: 'region', name: 'Region', semanticType: 'nominal', analyticType: 'dimension' },
    ] as IFieldMeta[];

    it('routes autopilot run requests', () => {
        expect(parseDataQuestion('Run AutoPilot now', fields).type).toBe('run_autopilot');
    });

    it('routes causal requests with matched fields', () => {
        const intent = parseDataQuestion('Try causal analysis on revenue', fields);
        expect(intent.type).toBe('run_causal');
        if (intent.type === 'run_causal') {
            expect(intent.fieldFids).toContain('revenue');
        }
    });

    it('navigates to dashboard', () => {
        const intent = parseDataQuestion('open dashboard', fields);
        expect(intent).toEqual({
            type: 'navigate',
            page: PIVOT_KEYS.dashboard,
            reason: 'dashboard',
        });
    });

    it('explains matched fields', () => {
        const intent = parseDataQuestion('Explain why revenue matters', fields);
        expect(intent.type).toBe('explain_fields');
        if (intent.type === 'explain_fields') {
            expect(intent.fieldFids).toContain('revenue');
        }
    });

    it('picks narrative fields from matches and defaults', () => {
        const picked = pickNarrativeFields(['revenue'], fields);
        expect(picked.map((f) => f.fid)).toEqual(expect.arrayContaining(['revenue']));
        expect(picked.length).toBe(2);
    });
});

describe('workflowSession', () => {
    it('roundtrips through query encoding', () => {
        const snapshot = createWorkflowSnapshot({
            appKey: PIVOT_KEYS.megaAuto,
            autopilotHandoff: {
                dimensions: ['region'],
                measures: ['revenue'],
                title: 'AutoPilot: region → revenue',
            },
        });
        const decoded = decodeWorkflowQuery(encodeWorkflowQuery(snapshot));
        expect(decoded).toEqual(snapshot);
    });

    it('builds a shareable url with hash and workflow param', () => {
        const snapshot = createWorkflowSnapshot({ appKey: PIVOT_KEYS.causal });
        const originalWindow = globalThis.window;
        Object.defineProperty(globalThis, 'window', {
            configurable: true,
            value: {
                location: {
                    href: 'http://localhost:9083/#dataSource',
                },
            },
        });
        try {
            const url = buildShareableWorkflowUrl(snapshot);
            expect(url).toContain('workflow=');
            expect(url).toContain('#causal');
        } finally {
            Object.defineProperty(globalThis, 'window', {
                configurable: true,
                value: originalWindow,
            });
        }
    });

    it('imports exported json', () => {
        const snapshot = createWorkflowSnapshot({ appKey: PIVOT_KEYS.dataSource });
        const imported = importWorkflowSession(JSON.stringify(snapshot));
        expect(imported.appKey).toBe(PIVOT_KEYS.dataSource);
    });
});
