const baseConfig = require('../../libs/tailwind-config');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      colors: {
        ...baseConfig.theme.extend.colors,
        // Slack-style theme colors (app-specific)
        navigation: '#1a1d29',
        selected: '#0ba8ca',
        presence: '#2eb67d',
        notification: '#e01e5a',

        // Contrast colors
        'off-white': '#FFFFFF',
        'off-black': '#1D1C1D',

        // Text colors for better contrast
        text: {
          primary: '#1D1C1D', // High contrast on light
          secondary: '#616061', // Medium contrast on light
          tertiary: '#868686', // Lower contrast on light
          inverse: '#FFFFFF', // White on dark
          'inverse-muted': '#D1D2D3', // Muted on dark
        },

        // Supporting grays
        border: '#DDDDDD',
        'border-dark': '#454245',
        muted: '#616061',
        subtle: '#F8F8F8',
      },
    },
  },
};
