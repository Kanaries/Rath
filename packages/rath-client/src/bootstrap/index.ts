import { bootstrapPlugin } from './plugin';

export async function bootstrap(): Promise<void> {
    try {
        await bootstrapPlugin?.beforeStart?.();
        const { mountRathApplication } = await import('../main');
        mountRathApplication(bootstrapPlugin);
    } catch (error) {
        if (bootstrapPlugin?.onStartError) {
            bootstrapPlugin.onStartError(error);
            return;
        }
        throw error;
    }
}

export type { RathBootstrapPlugin } from './types';
