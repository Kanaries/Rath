import { PIVOT_KEYS } from '../constants';
import type {
    AutopilotHandoff,
    CausalHandoff,
    EffectEstimateHandoff,
} from '../store/workflowStore';

export const WORKFLOW_SESSION_KEY = 'rath_workflow_session';
export const WORKFLOW_QUERY_PARAM = 'workflow';

export interface WorkflowSessionSnapshot {
    version: 1;
    appKey?: string;
    autopilotHandoff?: AutopilotHandoff | null;
    causalHandoff?: CausalHandoff | null;
    effectEstimate?: EffectEstimateHandoff | null;
}

export function createWorkflowSnapshot(input: {
    appKey?: string;
    autopilotHandoff?: AutopilotHandoff | null;
    causalHandoff?: CausalHandoff | null;
    effectEstimate?: EffectEstimateHandoff | null;
}): WorkflowSessionSnapshot {
    return {
        version: 1,
        appKey: input.appKey,
        autopilotHandoff: input.autopilotHandoff ?? null,
        causalHandoff: input.causalHandoff ?? null,
        effectEstimate: input.effectEstimate ?? null,
    };
}

export function saveWorkflowSession(snapshot: WorkflowSessionSnapshot): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(WORKFLOW_SESSION_KEY, JSON.stringify(snapshot));
}

export function loadWorkflowSession(): WorkflowSessionSnapshot | null {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(WORKFLOW_SESSION_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as WorkflowSessionSnapshot;
        return parsed?.version === 1 ? parsed : null;
    } catch {
        return null;
    }
}

export function encodeWorkflowQuery(snapshot: WorkflowSessionSnapshot): string {
    return encodeURIComponent(JSON.stringify(snapshot));
}

export function decodeWorkflowQuery(value: string): WorkflowSessionSnapshot | null {
    try {
        const parsed = JSON.parse(decodeURIComponent(value)) as WorkflowSessionSnapshot;
        return parsed?.version === 1 ? parsed : null;
    } catch {
        return null;
    }
}

export function buildShareableWorkflowUrl(snapshot: WorkflowSessionSnapshot): string {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set(WORKFLOW_QUERY_PARAM, encodeWorkflowQuery(snapshot));
    if (snapshot.appKey && Object.values(PIVOT_KEYS).includes(snapshot.appKey as typeof PIVOT_KEYS[keyof typeof PIVOT_KEYS])) {
        url.hash = `#/${snapshot.appKey}`;
    }
    return url.toString();
}

export function readWorkflowFromLocation(): WorkflowSessionSnapshot | null {
    if (typeof window === 'undefined') return null;
    const encoded = new URL(window.location.href).searchParams.get(WORKFLOW_QUERY_PARAM);
    if (!encoded) return null;
    return decodeWorkflowQuery(encoded);
}

export function exportWorkflowSession(snapshot: WorkflowSessionSnapshot): string {
    return JSON.stringify(snapshot, null, 2);
}

export function importWorkflowSession(text: string): WorkflowSessionSnapshot {
    const parsed = JSON.parse(text) as WorkflowSessionSnapshot;
    if (parsed?.version !== 1) {
        throw new Error('Unsupported workflow session version');
    }
    return parsed;
}

export function applyWorkflowSession(
    snapshot: WorkflowSessionSnapshot,
    handlers: {
        setAppKey: (key: string) => void;
        setAutopilotHandoff: (handoff: AutopilotHandoff | null) => void;
        setCausalHandoff: (handoff: CausalHandoff | null) => void;
        setEffectEstimate: (handoff: EffectEstimateHandoff | null) => void;
    },
): void {
    handlers.setAutopilotHandoff(snapshot.autopilotHandoff ?? null);
    handlers.setCausalHandoff(snapshot.causalHandoff ?? null);
    handlers.setEffectEstimate(snapshot.effectEstimate ?? null);
    if (snapshot.appKey) {
        handlers.setAppKey(snapshot.appKey);
    }
}
