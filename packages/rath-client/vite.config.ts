import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    plugins: [tailwindcss(), react()],
    resolve: {
        alias: {
            components: resolve(__dirname, 'src/components'),
            hooks: resolve(__dirname, 'src/hooks'),
            lib: resolve(__dirname, 'src/lib'),
            'runtime-env': resolve(__dirname, 'src/runtime-env.ts'),
            utils: resolve(__dirname, 'src/utils'),
        },
    },
    define: {
        global: 'globalThis',
    },
    server: {
        host: '0.0.0.0',
        port: 3000,
    },
    preview: {
        host: '0.0.0.0',
        port: 4173,
    },
    worker: {
        format: 'es',
    },
    build: {
        outDir: 'build',
        emptyOutDir: true,
        sourcemap: false,
    },
});
