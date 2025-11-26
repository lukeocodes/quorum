import themePreset from '@quorum/theme/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [themePreset],
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    '../../libs/ui/src/**/*.{js,jsx,ts,tsx}',
  ],
};

