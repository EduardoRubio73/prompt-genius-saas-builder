import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  base: "/genius/",

  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false
    }
  },

  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      devOptions: {
        enabled: false
      },
      manifest: {
        name: "Prompt Genius SaaS Builder",
        short_name: "PromptGenius",
        start_url: "/genius/",
        scope: "/genius/",
        display: "standalone",
        theme_color: "#0f172a",
        background_color: "#ffffff"
      }
    }),
    mode === "development" && componentTagger()
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
}));
