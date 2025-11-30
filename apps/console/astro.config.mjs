import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false, // We'll handle base styles ourselves
    }),
  ],
  server: {
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT || '4321', 10),
  },
});
