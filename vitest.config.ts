import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    server: {
      deps: {
        inline: [/@testing-library\/react/],
      },
    },
  },
});
