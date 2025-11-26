const reactConfig = require('../../libs/eslint-config/react');

module.exports = [
  ...reactConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['dist/**', 'dist-electron/**', 'node_modules/**'],
  },
];

