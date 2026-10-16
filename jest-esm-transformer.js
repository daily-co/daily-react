// Transpiles ESM-only dependencies (see transform in jest.config.js) to CJS.
// A separate module because Jest 27 caches transformers by path, so passing
// options to `babel-jest` directly would be shadowed by the preset's entry.
// .babelrc doesn't apply inside node_modules, hence the inline preset.
module.exports = require('babel-jest').default.createTransformer({
  presets: ['@babel/preset-env'],
});
