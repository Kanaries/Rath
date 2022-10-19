import { IRow } from 'visual-insights';
/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import fieldMetaWorker from '../workers/fieldMeta.worker?worker';
import { IFieldMeta, IRawField } from '../interfaces';
import { workerService } from './base';

export interface ComputeFieldMetaServiceProps {
    dataSource: IRow[];
    fields: IRawField[];
}
export async function computeFieldMetaService(props: ComputeFieldMetaServiceProps): Promise<IFieldMeta[]> {
    let metas: IFieldMeta[] = [];
    try {
        const worker = new fieldMetaWorker();
        const result = await workerService<IFieldMeta[], ComputeFieldMetaServiceProps>(worker, props);
        if (result.success) {
            metas = result.data;
        } else {
            throw new Error('[fieldMeta worker]' + result.message);
        }
        worker.terminate();
    } catch (error) {
        console.error(error);
    }
    return metas;
}
