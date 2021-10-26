module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    jest: true,
  },
  parserOptions: {
    project: './tsconfig.eslint.json',
    ecmaFeatures: {
      modules: true,
    },
    ecmaVersion: 6,
    sourceType: 'module',
    tsconfigRootDir: __dirname,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'simple-import-sort', 'prettier', 'jest'],
  rules: {
    // Unused vars are checked by @typescript-eslint/no-unused-vars
    'no-unused-vars': 0,
    'prettier/prettier': ['error'],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': [
      'warn',
      {
        additionalHooks: '(useRecoilCallback|useRecoilTransaction_UNSTABLE)',
      },
    ],
    // PropTypes are defined and checked via TypeScript
    'react/prop-types': 0,
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    // Imports are sorted via simple-import-sort
    'sort-imports': 0,
    'react-hooks/exhaustive-deps': [
      'warn',
      {
        additionalHooks: '(useRecoilCallback)',
      },
    ],
  },
  overrides: [
    {
      files: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
      rules: {
        'react/display-name': 0,
      },
    },
  ],
};
