import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — the build can be placed in any folder of a static host.
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
