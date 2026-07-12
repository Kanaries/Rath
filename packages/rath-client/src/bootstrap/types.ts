import type { ComponentType, PropsWithChildren } from 'react';

export interface RathBootstrapPlugin {
    beforeStart?(): void | Promise<void>;
    providers?: ComponentType<PropsWithChildren>;
    onStartError?(error: unknown): void;
}
