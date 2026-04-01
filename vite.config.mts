import { resolve } from 'node:path';

import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: process.env.BASE ?? '',

  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules\/(react|react-dom)/,
            },
          ],
        },
      },
    },
  },

  plugins: [
    react(),
    babel({
      presets:
        process.env.NODE_ENV === 'test' ? undefined : [reactCompilerPreset()],
    }),
  ],

  resolve: {
    alias: {
      src: resolve(__dirname, './src'),
    },
  },

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
