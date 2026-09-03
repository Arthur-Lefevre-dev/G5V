import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_G5V_API_URL || env.VUE_APP_G5V_API_URL || "";

  return {
    plugins: [
      vue(),
      vuetify({
        autoImport: true,
        styles: { configFile: "src/styles/settings.scss" }
      })
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      }
    },
    define: {
      "process.env.VUE_APP_G5V_API_URL": JSON.stringify(apiUrl),
      "process.env.NODE_ENV": JSON.stringify(mode),
      "process.env.BASE_URL": JSON.stringify("/")
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3301",
          changeOrigin: true,
          ws: true,
          rewrite: path => path.replace(/^\/api/, "")
        }
      }
    },
    build: {
      outDir: "dist",
      sourcemap: false
    }
  };
});
