import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('recharts')) return 'vendor-recharts';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('@tanstack/react-query')) return 'vendor-rq';
          if (id.includes('@reduxjs') || id.includes('/redux')) return 'vendor-redux';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('axios')) return 'vendor-axios';
          if (id.includes('react-dom')) return 'vendor-react';
          if (id.includes('/node_modules/react/')) return 'vendor-react';
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
