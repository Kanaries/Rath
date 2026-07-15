import { notify } from '../../components/error';
import { workerService } from '../../services';
import PredictWorker from './predict.worker?worker';
import type { IPredictProps, IPredictResult } from './predictTypes';

export * from './predictTypes';

export const execPredict = async (props: IPredictProps): Promise<IPredictResult | null> => {
    const worker = new PredictWorker();
    try {
        const payload = JSON.parse(JSON.stringify(props)) as IPredictProps;
        const result = await workerService<IPredictResult, IPredictProps>(worker, payload);
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data;
    } catch (error) {
        notify({
            title: 'Local Predict Failed',
            type: 'error',
            content: `${error}`,
        });
        return null;
    } finally {
        worker.terminate();
    }
};
