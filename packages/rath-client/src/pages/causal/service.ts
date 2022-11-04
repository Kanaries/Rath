import { IRow } from 'visual-insights';
import { IFieldMeta } from '../../interfaces';
import { workerService } from '../../services';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import ExpandDateTimeWorker from './computation.worker.js?worker';

interface CausalProps {
    dataSource: IRow[];
    fields: IFieldMeta[];
    matrix: number[][];
}

export async function causalService(props: CausalProps): Promise<number[][]> {
    try {
        const worker = new ExpandDateTimeWorker();
        const result = await workerService<number[][], CausalProps>(worker, props);
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
