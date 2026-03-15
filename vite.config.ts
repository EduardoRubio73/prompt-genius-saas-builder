import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(() => ({
  base: "/genius/",

  server: {
    host: true,
    port: 8080,
    hmr: {
      overlay: false
    }
  },

  plugins: [
    react(),

    componentTagger(),

    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "icons/icon-192x192.png",
        "icons/icon-512x512.png"
      ],

      manifest: {
        name: "Genius",
        short_name: "Genius",
        start_url: "/",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#0f172a",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },

  build: {
    sourcemap: false,
    outDir: "dist",
    emptyOutDir: true
  }
}));
