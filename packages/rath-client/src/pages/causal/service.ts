import { IRow } from 'visual-insights';
import { IFieldMeta } from '../../interfaces';
import { workerService } from '../../services';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import CausalComputationWorker from './computation.worker.js?worker';

type ICausalProps = {
    task: 'ig';
    dataSource: readonly IRow[];
    fields: readonly IFieldMeta[];
} | {
    task: 'ig_cond';
    dataSource: readonly IRow[];
    fields: readonly IFieldMeta[];
    matrix: readonly (readonly number[])[];
}

export async function causalService(props: ICausalProps): Promise<number[][]> {
    try {
        const worker = new CausalComputationWorker();
        const result = await workerService<number[][], ICausalProps>(worker, props);
        worker.terminate();
        if (result.success) {
            return result.data;
        } else {
            throw new Error(`[computation]: ${result.message}`);
        }
    } catch (error) {
        console.error(`[computation]: ${error}`);
        throw error;
    }
}
