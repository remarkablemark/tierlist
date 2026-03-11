import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * @see {@link https://vite.dev/config/}
 */
export default defineConfig({
  base: process.env.BASE ?? '',
  resolve: {
    alias: {
      src: resolve(__dirname, './src'),
    },
  },

  plugins: [
    react({
      babel:
        process.env.NODE_ENV === 'test'
          ? undefined
          : {
              plugins: [['babel-plugin-react-compiler']],
            },
    }),
  ],

  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.types.ts',
        'src/**/index.ts',
        'src/types/',
      ],
      thresholds: {
        100: true,
      },
    },
  },
});
