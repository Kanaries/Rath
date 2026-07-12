import type { RathBootstrapPlugin } from './types';

// Rath starts immediately. Insider replaces only this adapter with its SaaS
// authorization bootstrap until the contract is supplied by a plugin package.
export const bootstrapPlugin: RathBootstrapPlugin | undefined = undefined;
