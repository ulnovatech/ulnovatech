import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apacheBase = env.VITE_APACHE_BASE || "http://localhost/ulnovatech";
  const isProd = mode === "production";

  return {
    plugins: [react()],
    base: isProd ? "/portfolio-app/" : "/ulnovatech/portfolio/",
    server: {
      port: Number(env.VITE_PORT) || 5175,
      host: true,
      proxy: {
        "/php": {
          target: apacheBase,
          changeOrigin: true,
          secure: false,
        },
        "/portfolio/api": {
          target: apacheBase,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
