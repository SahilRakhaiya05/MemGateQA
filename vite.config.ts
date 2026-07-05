import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/health': 'http://localhost:8788',
      '/api': 'http://localhost:8788',
      '/remember': 'http://localhost:8788',
      '/recall': 'http://localhost:8788',
      '/improve': 'http://localhost:8788',
      '/forget': 'http://localhost:8788',
    },
  },
});