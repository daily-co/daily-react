module.exports = {
  preset: 'ts-jest/presets/js-with-babel',
  setupFilesAfterEnv: [
    '@testing-library/jest-dom/extend-expect',
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
