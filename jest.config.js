module.exports = {
  preset: 'ts-jest/presets/js-with-babel',
  setupFilesAfterEnv: [
    "<rootDir>/jest-setup.ts"
  ],
  moduleNameMapper: {
    "^react$": '<rootDir>/../../node_modules/react'
  },
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*{ts,tsx}'
  ]
};
