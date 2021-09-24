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
  extends: ['prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'simple-import-sort', 'prettier'],
  rules: {
    // Disabled for now. Discuss with the team:
    '@typescript-eslint/dot-notation': 0,
    '@typescript-eslint/no-shadow': 0,
    '@typescript-eslint/no-unused-expressions': 0, // e.g. foo && call(foo)
    'consistent-return': 0, // useEffect early returns
    'default-case': 0,
    'guard-for-in': 0, // for…in
    'import/no-cycle': 0,
    'no-console': [1, { allow: ['warn', 'error'] }],
    'no-empty': 0, // e.g. empty catch block
    'no-fallthrough': 0,
    'no-nested-ternary': 0,
    'no-param-reassign': 0,
    'no-plusplus': 0,
    'no-restricted-globals': 0, // e.g. location instead of window.location
    'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
    'no-underscore-dangle': 0, // useful for temporary variables
    // Confirmed defaults:
    '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
    'import/order': 0,
    'import/prefer-default-export': 0,
    'prettier/prettier': ['error'],
    'react/jsx-props-no-spreading': 0,
    'react/prop-types': 0,
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'sort-imports': 0,
  },
};
