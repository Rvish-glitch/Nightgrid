import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/geofences': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/vehicles': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/alerts': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/violations': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8080',
        ws: true,
      },
    },
  },
});
