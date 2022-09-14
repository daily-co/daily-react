const fs = require('fs-extra');

module.exports = {
  rollup(config, options) {
    config.plugins.push(
      {
        name: 'copy',
        hook: 'buildStart',
        generateBundle() {
          fs.copySync('src/types', 'dist/types', {
            overwrite: true,
            errorOnExist: false,
          });
        }
      }
    );
    return config;
  },
};
