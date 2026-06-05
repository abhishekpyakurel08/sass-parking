import { defineConfig, loadEnv } from "vite"
import vue from "@vitejs/plugin-vue"
import { fileURLToPath, URL } from "node:url"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_API_URL || 'http://localhost:5000';
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      }
    },
    server: {
      host: true, // allow network access during development
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false, // allow self-signed / local TLS during dev
          ws: true,      // proxy websocket connections if any
        }
      }
    }
  }
})