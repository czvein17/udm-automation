import { defineConfig, loadEnv } from "vite";
import path from "path";

import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, path.resolve(__dirname, ".."));
  process.env = { ...process.env, ...env };

  return defineConfig({
    plugins: [
      // Please make sure that '@tanstack/router-plugin' is passed before '@vitejs/plugin-react'
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@styles": path.resolve(__dirname, "src/styles"),
        "@assets": path.resolve(__dirname, "src/assets"),
        "@layout": path.resolve(__dirname, "src/layout"),
        "@layouts": path.resolve(__dirname, "src/layout"),
        "@components": path.resolve(__dirname, "src/components"),
        "@features": path.resolve(__dirname, "src/features"),
        "@types": path.resolve(__dirname, "src/types"),
      },
    },

    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
        "/ws": {
          target: "ws://localhost:3000",
          ws: true,
          changeOrigin: true,
        },
      },
    },
  });
};
