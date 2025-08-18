import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import terser from '@rollup/plugin-terser';
import { babel } from '@rollup/plugin-babel';
import copy from 'rollup-plugin-copy';
import fs from 'fs-extra';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const commonPlugins = [
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
    presets: [['@babel/preset-env', { exclude: ['transform-regenerator'] }]],
  }),
];

const externalDependencies = ['@daily-co/daily-js', 'jotai', 'react', 'react-dom'];

export default [
  // ESM build (unminified)
  {
    input: 'src/index.ts',
    output: {
      file: packageJson.module,
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      ...commonPlugins,
      copy({
        targets: [{ src: 'src/types', dest: 'dist' }],
      }),
    ],
    external: externalDependencies,
  },
  // CJS build (minified)
  {
    input: 'src/index.ts',
    output: {
      file: packageJson.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      ...commonPlugins,
      terser({
        ecma: 2018, // Target ES2018+ since WebRTC requires modern browsers
        compress: {
          passes: 2, // Run compression twice for better results
          unsafe: true, // Enable unsafe optimizations (safe for modern browsers)
        },
        mangle: {
          properties: {
            regex: /^_/, // Mangle properties starting with underscore
          },
          safari10: false, // Don't worry about Safari 10 compatibility
        },
        format: {
          comments: false, // Remove all comments
          ecma: 2018, // Use modern JS syntax in output
        },
      }),
    ],
    external: externalDependencies,
  },
];
