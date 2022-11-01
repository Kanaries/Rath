import { IRow } from 'visual-insights';
import { IRawField } from '../interfaces';
import { workerService } from '../services';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import ExpandDateTimeWorker from './workers/dateTimeExpand.worker.js?worker';
import { dateTimeExpand, doTest } from './workers/engine/dateTimeExpand';
import { checkExpandEnv } from './workers/engine/checkExpandEnv';

interface ExpandDateTimeProps {
    dataSource: IRow[];
    fields: IRawField[];
}

const ExpandEnv = checkExpandEnv();

/**
 * @deprecated use generic fields extension API
 */
export async function expandDateTimeService(props: ExpandDateTimeProps): Promise<ExpandDateTimeProps> {
    if (ExpandEnv === 'debug') {
        doTest();
        let res = dateTimeExpand(props) as ExpandDateTimeProps;
        return res;
    } else {
        try {
            const worker = new ExpandDateTimeWorker();
            const result = await workerService<ExpandDateTimeProps, ExpandDateTimeProps>(worker, props);
            worker.terminate();
            if (result.success) {
                return result.data;
            } else {
                throw new Error(`[ExpandDateTimeWorker]: ${result.message}`);
            }
        } catch (error) {
            console.error(`[ExpandDateTimeWorker]: ${error}`);
            throw error;
        }
    }
}
