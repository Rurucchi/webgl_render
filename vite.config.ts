import { defineConfig } from "vite";

export default defineConfig((args) => ({
  appType: "mpa", // Disable SPA fallback
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    port: 9090,
    host: true,
  },
  define: {
    __DEBUG__: args.mode === "development" ? "true" : "false",
  },
  optimizeDeps: {
    exclude: ["@mori2003/jsimgui", "@mori2003/jsimgui_impl_web"],
  },
}));
