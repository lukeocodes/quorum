import baseConfig from '../../libs/tailwind-config/index.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      ...baseConfig.theme?.extend,
      colors: {
        ...(baseConfig.theme?.extend?.colors || {}),
        // Slack-style theme colors (matching Electron app)
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
  plugins: baseConfig.plugins || [],
};
