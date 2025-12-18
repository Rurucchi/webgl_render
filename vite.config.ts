import { defineConfig } from 'vite';

export default defineConfig((args) => ({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    port: 9090,
    host: true,
  },
  define: {
    __DEBUG__: args.mode === "development" ? "true" : "false"
  }
}));