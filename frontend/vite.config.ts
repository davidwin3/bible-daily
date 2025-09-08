import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    plugins: [
      react({
        babel: isDev
          ? {
              plugins: [
                [
                  "@locator/babel-jsx/dist",
                  {
                    env: "development",
                  },
                ],
              ],
            }
          : undefined,
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
    define: isDev
      ? {
          __LOCATOR__: true,
        }
      : {},
  };
});
