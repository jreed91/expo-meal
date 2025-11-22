import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    include: ['**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test-setup.ts',
        '**/*.config.{js,ts}',
        '**/types/**',
      ],
    },
    server: {
      deps: {
        inline: [
          'react-native',
          'react-native-web',
          '@expo/vector-icons',
          'expo-modules-core',
        ],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'react-native': 'react-native-web',
      'react-native/Libraries/Utilities/Platform': 'react-native-web/dist/exports/Platform',
    },
  },
});
