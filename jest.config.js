module.exports = {
  preset: 'ts-jest/presets/js-with-babel',
  setupFilesAfterEnv: [
    "<rootDir>/jest-setup.ts"
  ],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    // jotai-family ships ESM as its `main`; Jest 27 doesn't read the package
    // `exports` map, so point it at the CJS build it exposes via `require`.
    '^jotai-family$': 'jotai-family/dist/cjs/index.js',
    // Force a single React instance. The CI matrix installs React via a
    // separate `yarn add`, which can leave jotai with its own nested copy of
    // React; two React runtimes break hooks ("Cannot read properties of null
    // (reading 'useRef')"). Pin every `react`/`react-dom` import to one copy.
    '^react$': require.resolve('react'),
    '^react-dom$': require.resolve('react-dom'),
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*{ts,tsx}'],
};