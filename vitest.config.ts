import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.vue',
        'src/**/index.ts',
        'src/初始化.ts',
        'src/设置界面.ts',
      ],
      thresholds: {
        'src/core/**': {
          lines: 90,
          branches: 85,
        },
        'src/stores/**': {
          lines: 80,
          branches: 70,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@util': resolve(__dirname, 'util'),
    },
  },
});
