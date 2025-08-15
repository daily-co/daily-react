import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import terser from '@rollup/plugin-terser';
import { babel } from '@rollup/plugin-babel';
import copy from 'rollup-plugin-copy';
import fs from 'fs-extra';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

export default [
  // ESM build (unminified)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      peerDepsExternal(),
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/*.test.*', '**/*.stories.*'],
      }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        presets: [
          ['@babel/preset-env', { exclude: ['transform-regenerator'] }],
        ],
      }),
      copy({
        targets: [{ src: 'src/types', dest: 'dist' }],
      }),
    ],
    external: ['@daily-co/daily-js', 'jotai', 'react', 'react-dom'],
  },
  // CJS build (minified)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      peerDepsExternal(),
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/*.test.*', '**/*.stories.*'],
      }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        presets: [
          ['@babel/preset-env', { exclude: ['transform-regenerator'] }],
        ],
      }),
      terser(),
    ],
    external: ['@daily-co/daily-js', 'jotai', 'react', 'react-dom'],
  },
];
