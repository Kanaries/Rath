import { Record, Filters, SemanticType, IMeasure } from './interfaces';
import { Insight } from 'visual-insights';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import InsightSpaceWorker from './workers/InsightService.worker';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import ExplainerWorker from './workers/explainer.worker';
import { View, Specification } from 'visual-insights/build/esm/commonTypes';
import { IExplaination, IMeasureWithStat } from './insights';

interface WorkerState {
    worker: Worker | null;
}

const workerState: WorkerState = {
    worker: null
}

function workerService<T, R>(worker: Worker, data: R): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        worker.postMessage(data);
        worker.onmessage = (e: MessageEvent) => {
            resolve(e.data);
        };
        worker.onerror = (e: ErrorEvent) => {
            reject({
                success: false,
                message: e,
            });
        };
    });
}

interface ExplainParams {
    dimensions: string[];
    measures: string[];
    dataSource: Record[];
    filters?: Filters;
    currentSpace: {
        dimensions: string[];
        measures: IMeasure[];
    };
}
export interface IVisSpace {
    dataView: Record[];
    schema: Specification;
}
interface ExplainReturns {
    explainations: IExplaination[];
    valueExp: IMeasureWithStat[];
    visSpaces: IVisSpace[];
    fieldsWithSemanticType: Array<{ key: string; type: SemanticType }>;
}
export async function getExplaination(props: ExplainParams) {
    const worker = workerState.worker;
    if (worker === null) throw new Error('init worker first.')
    let result: ExplainReturns = {
        explainations: [],
        valueExp: [],
        visSpaces: [],
        fieldsWithSemanticType: [],
    };
    try {
        result = await workerService<ExplainReturns, { type: string; data: ExplainParams }>(
            worker,
            {
                type: 'getExplaination',
                data: props
            }
        );
        return result;
    } catch (error) {
        console.error(error);
    }
    return result;
}

interface PreAnalysisParams {
    dimensions: string[];
    measures: string[];
    dataSource: Record[];
}
export async function preAnalysis(props: PreAnalysisParams) {
    if (workerState.worker !== null) {
        workerState.worker.terminate();
    }
    try {
        workerState.worker = new ExplainerWorker() as Worker;
        await workerService<boolean, { type: string; data: PreAnalysisParams}>(workerState.worker, { type: 'preAnalysis', data: props });
    } catch (error) {
        console.error(error)
    }
}

export function destroyWorker() {
    if (workerState.worker) {
        workerState.worker.terminate();
        workerState.worker = null;
    }
}
