import { PIVOT_KEYS } from '../constants';
import type { IFieldMeta } from '../interfaces';
import type { CommonStore } from '../store/commonStore';
import type CausalStore from '../store/causalStore/mainStore';
import type { MegaAutomationStore } from '../store/megaAutomation';
import type { WorkflowStore } from '../store/workflowStore';
import { createWorkflowSnapshot, saveWorkflowSession } from './workflowSession';

export type AssistantIntent =
    | { type: 'navigate'; page: string; reason: string }
    | { type: 'run_autopilot'; reason: string }
    | { type: 'run_causal'; fieldFids: string[]; reason: string }
    | { type: 'focus_fields'; fieldFids: string[]; reason: string }
    | { type: 'explain_fields'; fieldFids: string[]; reason: string }
    | { type: 'unknown'; reason: string; suggestions: string[] };

const NAV_PATTERNS: Array<{ pattern: RegExp; page: string; reason: string }> = [
    { pattern: /\b(auto\s*pilot|autopilot|scan|rank(ed)?\s*insights?|interesting)\b/i, page: PIVOT_KEYS.megaAuto, reason: 'autopilot' },
    { pattern: /\b(copilot|semi[- ]?auto|pattern|correlation)\b/i, page: PIVOT_KEYS.semiAuto, reason: 'copilot' },
    { pattern: /\b(causal|cause|effect|why does|what drives)\b/i, page: PIVOT_KEYS.causal, reason: 'causal' },
    { pattern: /\b(dashboard|report)\b/i, page: PIVOT_KEYS.dashboard, reason: 'dashboard' },
    { pattern: /\b(manual|chart|explore|graphic walker)\b/i, page: PIVOT_KEYS.editor, reason: 'manual' },
    { pattern: /\b(paint|painter)\b/i, page: PIVOT_KEYS.painter, reason: 'painter' },
    { pattern: /\b(import|load|connect|data source|prepare)\b/i, page: PIVOT_KEYS.dataSource, reason: 'datasource' },
];

const EXPLAIN_PATTERN = /\b(why|explain|what|how|describe|tell me about)\b/i;

function normalize(text: string): string {
    return text.trim().toLowerCase();
}

function matchFields(question: string, fields: readonly IFieldMeta[]): string[] {
    const q = normalize(question);
    const hits: string[] = [];
    for (const field of fields) {
        if (field.fid === '__index__') continue;
        const name = (field.name || field.fid).trim();
        if (!name) continue;
        const token = normalize(name);
        if (token.length >= 2 && q.includes(token)) {
            hits.push(field.fid);
        }
    }
    return hits;
}

export function pickNarrativeFields(
    fieldFids: readonly string[],
    allFields: readonly IFieldMeta[],
): IFieldMeta[] {
    const byId = new Map(allFields.map((f) => [f.fid, f]));
    const picked = fieldFids.map((fid) => byId.get(fid)).filter(Boolean) as IFieldMeta[];
    if (picked.length >= 2) {
        return picked.slice(0, 2);
    }

    const measures = allFields.filter((f) => f.analyticType === 'measure' && f.fid !== '__index__');
    const dimensions = allFields.filter((f) => f.analyticType === 'dimension' && f.fid !== '__index__');
    const result: IFieldMeta[] = [...picked];
    for (const candidate of [...dimensions, ...measures]) {
        if (result.length >= 2) break;
        if (!result.some((f) => f.fid === candidate.fid)) {
            result.push(candidate);
        }
    }
    return result.slice(0, 2);
}

export function parseDataQuestion(question: string, fields: readonly IFieldMeta[]): AssistantIntent {
    const q = question.trim();
    if (!q) {
        return {
            type: 'unknown',
            reason: 'empty',
            suggestions: [
                'Which fields correlate with revenue?',
                'Run AutoPilot on this dataset',
                'Try causal analysis on sales',
            ],
        };
    }

    const matchedFields = matchFields(q, fields);

    if (EXPLAIN_PATTERN.test(q) && matchedFields.length > 0) {
        return {
            type: 'explain_fields',
            fieldFids: matchedFields,
            reason: 'explain_fields',
        };
    }

    if (/\b(run|start|launch)\b.*\b(auto\s*pilot|autopilot)\b/i.test(q) || /\b(auto\s*pilot|autopilot)\b.*\b(run|start|now)\b/i.test(q)) {
        return { type: 'run_autopilot', reason: 'explicit_autopilot' };
    }

    if (/\b(causal|cause|effect)\b/i.test(q)) {
        return {
            type: 'run_causal',
            fieldFids: matchedFields,
            reason: 'explicit_causal',
        };
    }

    for (const entry of NAV_PATTERNS) {
        if (entry.pattern.test(q)) {
            if (entry.page === PIVOT_KEYS.causal) {
                return {
                    type: 'run_causal',
                    fieldFids: matchedFields,
                    reason: entry.reason,
                };
            }
            if (entry.page === PIVOT_KEYS.megaAuto && /\b(run|start|go)\b/i.test(q)) {
                return { type: 'run_autopilot', reason: entry.reason };
            }
            return { type: 'navigate', page: entry.page, reason: entry.reason };
        }
    }

    if (matchedFields.length > 0) {
        return {
            type: 'focus_fields',
            fieldFids: matchedFields,
            reason: 'matched_fields',
        };
    }

    if (EXPLAIN_PATTERN.test(q)) {
        return {
            type: 'explain_fields',
            fieldFids: matchedFields,
            reason: 'explain_without_fields',
        };
    }

    return {
        type: 'unknown',
        reason: 'no_match',
        suggestions: [
            'Run AutoPilot',
            'Try causal analysis',
            'Open dashboard',
        ],
    };
}

export type AssistantStores = {
    commonStore: CommonStore;
    megaAutoStore: MegaAutomationStore;
    causalStore: CausalStore;
    workflowStore: WorkflowStore;
};

export function persistAssistantWorkflow(stores: AssistantStores, appKey?: string): void {
    saveWorkflowSession(createWorkflowSnapshot({
        appKey: appKey ?? stores.commonStore.appKey,
        autopilotHandoff: stores.workflowStore.autopilotHandoff,
        causalHandoff: stores.workflowStore.causalHandoff,
        effectEstimate: stores.workflowStore.effectEstimate,
    }));
}

export function executeAssistantIntent(intent: AssistantIntent, stores: AssistantStores): string | null {
    const { commonStore, megaAutoStore, causalStore } = stores;

    switch (intent.type) {
        case 'navigate':
            commonStore.setAppKey(intent.page);
            persistAssistantWorkflow(stores, intent.page);
            return intent.page;
        case 'run_autopilot':
            commonStore.setAppKey(PIVOT_KEYS.megaAuto);
            megaAutoStore.init();
            persistAssistantWorkflow(stores, PIVOT_KEYS.megaAuto);
            return PIVOT_KEYS.megaAuto;
        case 'run_causal': {
            if (intent.fieldFids.length > 0 && causalStore.dataset.allFields.length > 0) {
                const indices = intent.fieldFids
                    .map((fid) => causalStore.dataset.allFields.findIndex((f) => f.fid === fid))
                    .filter((idx) => idx >= 0);
                if (indices.length > 0) {
                    causalStore.dataset.selectFields(indices);
                }
            }
            if (Object.keys(causalStore.operator.causalAlgorithmForm ?? {}).includes('PC')) {
                causalStore.operator.algorithm = 'PC';
            }
            commonStore.setAppKey(PIVOT_KEYS.causal);
            persistAssistantWorkflow(stores, PIVOT_KEYS.causal);
            return PIVOT_KEYS.causal;
        }
        case 'focus_fields':
        case 'explain_fields':
        case 'unknown':
            return null;
        default:
            return null;
    }
}
