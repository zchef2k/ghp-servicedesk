// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://zchef2k.github.io',
  base: '/ghp-servicedesk',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});