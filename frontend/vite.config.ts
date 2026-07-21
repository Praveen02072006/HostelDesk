import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Pre-bundle heavy deps for faster dev cold starts
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'zustand',
      'clsx',
      'lucide-react',
      'react-hot-toast',
      'date-fns',
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    sourcemap: false,
    // Optimize CSS
    cssMinify: true,
    // Target modern browsers for smaller output
    target: 'es2020',
    // Increase chunk warning limit
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
          'vendor-utils': ['axios', 'zustand', 'date-fns', 'clsx', 'zod'],
          'vendor-ui': ['lucide-react', 'react-hot-toast', 'react-hook-form', '@hookform/resolvers'],
          'vendor-pdf': ['jspdf', 'html2canvas', 'xlsx'],
        },
      },
    },
  },
});

