import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
// import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import bundleSize from 'rollup-plugin-bundle-size';
import { terser } from 'rollup-plugin-terser';
import pkg from "./package.json";

export default defineConfig({
  strictDeprecations: true,
  input: "index.js",
  output: [
    {
      file: pkg.module,
      format: "esm",
      sourcemap: false,
    },
    {
      file: pkg.main,
      format: "umd",
      sourcemap: false,
      name: "vega-painter-renderer",
    },
  ],
  plugins: [
    nodeResolve({
      browser: true,
      modulesOnly: true,
      customResolveOptions: { preserveSymlinks: false }
    }),
    commonjs(),
    babel({
      exclude: "node_modules/**",
      extensions: [".js", ".ts"],
      babelHelpers: "runtime",
    }),
    // typescript({
    //   sourceMap: true,
    //   tsconfig: "./tsconfig.json",
    //   declaration: true,
    //   declarationDir: "./dist",
    // }),
  ],
});
