import RInsightWorker from '../workers/insight/r-insight.worker?worker';
import type { IRInsightExplainProps, IRInsightExplainResult } from '../workers/insight/r-insight.worker';
import { getGlobalStore } from '../store';
import { workerService } from './base';
import type { CausalServiceMode } from '../pages/causal/config';

export const RInsightService = async (props: IRInsightExplainProps, mode: CausalServiceMode = 'worker'): Promise<IRInsightExplainResult> => {
    const { causalStore } = getGlobalStore();

    if (mode === 'server') {
        const { causalServer } = causalStore.operator;
        const res = await fetch(`${causalServer}/explain`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(props),
        });
        const result = await res.json();
        if (result.success) {
            return result.data;
        } else {
            throw new Error('[RInsight server]' + result.message);
        }
    }
    const worker = new RInsightWorker();
    try {
        const result = await workerService<IRInsightExplainResult, IRInsightExplainProps>(worker, props);
        if (result.success) {
            return result.data;
        } else {
            throw new Error('[RInsight worker]' + result.message);
        }
    } finally {
        worker.terminate();
    }
};
