const baseConfig = require('../../libs/eslint-config');

module.exports = [
  ...baseConfig,
  {
    files: ['**/*.{js,ts}'],
    ignores: ['dist/**', 'node_modules/**'],
  },
];

