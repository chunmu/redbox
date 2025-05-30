import { defineConfig } from 'vite';
import path from 'node:path';

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
  define: {
    MAIN_WINDOW_VITE_NAME: JSON.stringify("workbench"),
  },
});
