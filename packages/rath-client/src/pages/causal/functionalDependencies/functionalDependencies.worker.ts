/* eslint no-restricted-globals: 0 */
import { detectFunctionalDependencies, type FunctionalDependencyDetectionRequest } from './local';

self.addEventListener('message', (event: MessageEvent<FunctionalDependencyDetectionRequest>) => {
    try {
        self.postMessage({
            success: true,
            data: detectFunctionalDependencies(event.data),
        });
    } catch (error) {
        self.postMessage({
            success: false,
            message: error instanceof Error ? error.message : String(error),
        });
    }
});
