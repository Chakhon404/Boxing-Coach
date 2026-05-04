import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['sounds/**/*.mp3', 'icon.png'],
      manifest: {
        name: 'AI Boxing Coach',
        short_name: 'BoxingCoach',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#00ff88',
        orientation: 'any',
        icons: [
          {
            src: '/icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
