import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// v0.43.0 — manual chunks: split heavy 3rd-party deps so the initial bundle
// is smaller and chart/spreadsheet code loads in parallel.
// Vite 8 / rolldown requires manualChunks as a function (not an object).
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('recharts')) return 'recharts';
          if (id.includes('xlsx')) return 'xlsx';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('puppeteer') || id.includes('@sparticuz')) return undefined; // server-only, never in client
          if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor';
          return 'vendor';
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})
