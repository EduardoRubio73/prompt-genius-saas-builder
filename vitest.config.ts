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
      registerType: "autoUpdate"
    })
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
}));
