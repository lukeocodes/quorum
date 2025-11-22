const reactConfig = require('../eslint-config/react');

module.exports = [
  ...reactConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['dist/**', 'node_modules/**'],
  },
];

