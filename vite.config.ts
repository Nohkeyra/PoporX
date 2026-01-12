import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'process';

export default defineConfig(({ mode }) => {
  // Load env files
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    base: './', // Critical for Capacitor and relative paths
    define: {
      // This injects the API Key into the build so geminiService.ts can read it
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill simple process.env checks
      'process.env': {
         NODE_ENV: JSON.stringify(mode)
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      emptyOutDir: true,
    },
    server: {
      host: true,
      port: 5173,
    },
    publicDir: 'public',
  };
});