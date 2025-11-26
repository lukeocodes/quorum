const baseConfig = require('@quorum/theme/tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  // This root config is primarily for editor IntelliSense
  // Individual apps should have their own configs with proper content paths
  content: [
    './apps/*/src/**/*.{js,jsx,ts,tsx,astro,html}',
    './apps/*/index.html',
    './libs/components/src/**/*.{js,jsx,ts,tsx}',
  ],
};

