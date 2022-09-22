import { defineConfig } from 'vite'
import path from 'path';
import reactRefresh from '@vitejs/plugin-react-refresh'
import typescript from '@rollup/plugin-typescript'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 2002,
    proxy: {
      '/datasets': 'http://localhost:8080',
    },
  },
  plugins: [
    // @ts-ignore
    reactRefresh(),
    // @ts-ignore
    {
      ...typescript({
        tsconfig: path.resolve(__dirname, './tsconfig.json'),
      }),
      apply: 'build'
    }
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/index.tsx'),
      name: 'GraphicWalker',
      fileName: (format) => `graphic-walker.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      
    },
    minify: 'esbuild',
    sourcemap: true,
  }
})
