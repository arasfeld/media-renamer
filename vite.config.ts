import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tauri expects a fixed port, and fails if it's already in use
  server: {
    port: 5173,
    strictPort: true,
  },
  // envPrefix ensures that only variables prefixed with TAURI_ are exposed to the frontend
  // but we can keep our current ones for now
  envPrefix: ['VITE_', 'TAURI_', 'TMDB_'],
  build: {
    // Tauri supports es2021
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    // don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
