import { PIVOT_KEYS } from '../constants';
import { readAppKeyFromHash } from '../store/commonStore';
import type {
    AutopilotHandoff,
    CausalHandoff,
    EffectEstimateHandoff,
} from '../store/workflowStore';
import {
    applyWorkflowSession,
    loadWorkflowSession,
    readWorkflowFromLocation,
    type WorkflowSessionSnapshot,
} from './workflowSession';

export type NavigationHandlers = {
    setAppKey: (key: string, options?: { syncHash?: boolean }) => void;
    setAutopilotHandoff: (handoff: AutopilotHandoff | null) => void;
    setCausalHandoff: (handoff: CausalHandoff | null) => void;
    setEffectEstimate: (handoff: EffectEstimateHandoff | null) => void;
};

export function resolveInitialNavigation(): {
    snapshot: WorkflowSessionSnapshot | null;
    hashKey: string | null;
} {
    const snapshot = readWorkflowFromLocation() ?? loadWorkflowSession();
    const hashKey = readAppKeyFromHash();
    return { snapshot, hashKey };
}

export function applyInitialNavigation(handlers: NavigationHandlers): void {
    const { snapshot, hashKey } = resolveInitialNavigation();
    if (snapshot) {
        applyWorkflowSession(snapshot, {
            setAppKey: (key) => handlers.setAppKey(key, { syncHash: false }),
            setAutopilotHandoff: handlers.setAutopilotHandoff,
            setCausalHandoff: handlers.setCausalHandoff,
            setEffectEstimate: handlers.setEffectEstimate,
        });
        return;
    }
    if (hashKey) {
        handlers.setAppKey(hashKey, { syncHash: false });
    }
}

export function navigateToPage(handlers: Pick<NavigationHandlers, 'setAppKey'>, page: string): void {
    if (Object.values(PIVOT_KEYS).includes(page as typeof PIVOT_KEYS[keyof typeof PIVOT_KEYS])) {
        handlers.setAppKey(page);
    }
}
