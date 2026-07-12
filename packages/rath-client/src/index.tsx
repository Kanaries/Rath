import { Buffer } from 'buffer';
import { bootstrap } from './bootstrap';

// CRA's Webpack setup exposed Buffer implicitly. Vite intentionally does not
// polyfill Node globals, so provide only the compatibility surface Rath uses.
const browserGlobals = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
browserGlobals.Buffer ??= Buffer;

void bootstrap();
