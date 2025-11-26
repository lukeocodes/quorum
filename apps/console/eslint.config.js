const astroConfig = require('../../libs/eslint-config/astro');

module.exports = [
  ...astroConfig,
  {
    files: ['**/*.{js,ts,astro}'],
    ignores: ['dist/**', 'node_modules/**', '.astro/**'],
  },
];

