/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['lumina-icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Lumina',
        short_name: 'Lumina',
        description: 'Cognitive Sanctuary & Local Clarity',
        theme_color: '#0E0E0C',
        background_color: '#0E0E0C',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/lumina-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  // @ts-expect-error vitest is fighting with vite types
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    exclude: ['docs/**', 'node_modules/**', 'tests/e2e/**']
  }
});
