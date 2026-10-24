import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — сборку можно положить в любую папку статического хостинга.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'] },
      },
    },
  },
});
