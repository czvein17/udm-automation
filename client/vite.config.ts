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
