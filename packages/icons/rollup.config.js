// rollup.config.js
import typescript from 'rollup-plugin-typescript2'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'

const extensions = ['.js', '.jsx', '.ts', '.tsx']

export default {
  input: 'src/index.ts',

  output: [
    {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'dist/index.min.js',
      format: 'esm',
      sourcemap: true,
      plugins: [terser()],
    },
  ],

  plugins: [
    peerDepsExternal(),
    resolve({ extensions }),
    commonjs(),
    typescript(),
    babel({
      extensions,
      babelHelpers: 'bundled',
      presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
    }),
  ],
}
