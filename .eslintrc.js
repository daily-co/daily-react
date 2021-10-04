module.exports = {
  root: true,
  env: {
    browser: true,
  },
  parserOptions: {
    project: './tsconfig.eslint.json',
    ecmaFeatures: {
      modules: true
    },
    ecmaVersion: 6,
    sourceType: 'module',
    tsconfigRootDir: __dirname,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'simple-import-sort', 'prettier'],
  rules: {
    // Unused vars are checked by @typescript-eslint/no-unused-vars
    'no-unused-vars': 0,
    'prettier/prettier': ['error'],
    // PropTypes are defined and checked via TypeScript
    'react/prop-types': 0,
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    // Imports are sorted via simple-import-sort
    'sort-imports': 0,
  },
};
