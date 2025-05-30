import path from 'node:path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@workbench': path.resolve(__dirname, 'src/workbench'),
      '@i18n': path.resolve(__dirname, 'src/i18n'),
      '@base': path.resolve(__dirname, 'src/base'),
      '@platform': path.resolve(__dirname, 'src/platform'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
});
