import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Nạp các biến môi trường từ thư mục hiện tại và thư mục gốc
  const env = loadEnv(mode, process.cwd(), '');
  const productionApiUrl = env.PRODUCTION_API_URL || env.VITE_API_URL || '';

  return {
    plugins: [react()],
    define: {
      'import.meta.env.PRODUCTION_API_URL': JSON.stringify(productionApiUrl)
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: productionApiUrl || 'http://localhost:5000',
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist'
    }
  };
});
