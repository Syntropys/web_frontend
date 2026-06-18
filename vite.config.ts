import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

function figmaAssetResolver() {
  return {
    name: "figma-asset-resolver",
    resolveId(id) {
      if (id.startsWith("figma:asset/")) {
        const filename = id.replace("figma:asset/", "");
        return path.resolve(__dirname, "src/assets", filename);
      }
    },
  };
}

function inlineCssPlugin() {
  return {
    name: "inline-css",
    apply: "build" as const,
    enforce: "post" as const,
    generateBundle(options: any, bundle: any) {
      const cssFiles = Object.keys(bundle).filter((f) => f.endsWith(".css"));
      const htmlFiles = Object.keys(bundle).filter((f) => f.endsWith(".html"));
      if (!cssFiles.length || !htmlFiles.length) return;

      const cssKey = cssFiles[0];
      const cssAsset = bundle[cssKey];
      if (cssAsset.type !== "asset") return;

      const cssContent = cssAsset.source;
      for (const htmlKey of htmlFiles) {
        const htmlAsset = bundle[htmlKey];
        if (htmlAsset.type !== "asset") continue;
        let html = htmlAsset.source as string;
        const escapedKey = cssKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`<link[^>]*href=["'](?:\\./)?/?${escapedKey}["'][^>]*>`, "g");
        html = html.replace(regex, `<style>${cssContent}</style>`);
        htmlAsset.source = html;
      }
      delete bundle[cssKey];
    },
  };
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    inlineCssPlugin(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      // Alias @ to the src directory
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ["**/*.svg", "**/*.csv"],
});
