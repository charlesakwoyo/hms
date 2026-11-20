import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.VITE_BACKEND_URL || 'http://localhost:8000';

  return {
    base: './',
    plugins: [react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': { target: backend, changeOrigin: false },
        '/sanctum': { target: backend, changeOrigin: false },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
