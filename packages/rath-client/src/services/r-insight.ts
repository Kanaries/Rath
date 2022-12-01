/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
import RInsightWorker from '../workers/insight/r-insight.worker?worker';
import type { IRInsightExplainProps, IRInsightExplainResult } from '../workers/insight/r-insight.worker';
import { getGlobalStore } from '../store';
import { workerService } from './base';


export const RInsightService = async (props: IRInsightExplainProps, mode: 'worker' | 'server'): Promise<IRInsightExplainResult> => {
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
    const result = await workerService<IRInsightExplainResult, IRInsightExplainProps>(worker, props);
    worker.terminate();
    if (result.success) {
        return result.data;
    } else {
        throw new Error('[RInsight worker]' + result.message);
    }
};
