import { defineConfig, loadEnv } from "vite";
import path from "path";

import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, path.resolve(__dirname, ".."));
  process.env = { ...process.env, ...env };

  const apiProxyTarget = process.env.VITE_SERVER_URL || "http://localhost:3000";
  const wsProxyTarget =
    process.env.VITE_SERVER_URL ||
    apiProxyTarget.replace(/^http:/, "ws:").replace(/^https:/, "wss:");

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
          target: apiProxyTarget,
          changeOrigin: true,
        },
        "/ws": {
          target: wsProxyTarget,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  });
};
