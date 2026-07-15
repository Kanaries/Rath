/* eslint no-restricted-globals: 0 */
import { executeLocalPredict } from './predictLocal';
import type { IPredictProps } from './predictTypes';

self.addEventListener('message', (event: MessageEvent<IPredictProps>) => {
    try {
        self.postMessage({
            success: true,
            data: executeLocalPredict(event.data),
        });
    } catch (error) {
        self.postMessage({
            success: false,
            message: error instanceof Error ? error.message : String(error),
        });
    }
});
