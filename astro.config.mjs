// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://confeccionarte.vercel.app', // Cambiar por el dominio real
  output: 'server',
  adapter: vercel(),
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwind()],
    optimizeDeps: {
      include: ['react-dom/client']
    }
  },
  security: {
    checkOrigin: true
  }
});
