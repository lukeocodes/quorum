const baseConfig = require('./base.js');
const astro = require('eslint-plugin-astro');

module.exports = [
  ...baseConfig,
  ...astro.configs.recommended,
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: require('astro-eslint-parser'),
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
      },
    },
  },
];

