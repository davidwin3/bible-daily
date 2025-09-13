import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import type { Plugin, ViteDevServer } from "vite";

// Service Worker 환경변수 처리 함수
const processServiceWorker = () => {
  const envVars = {
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || "http://localhost:3000",
    VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || "",
    VITE_FIREBASE_MESSAGING_SENDER_ID:
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  };

  const swTemplatePath = path.resolve(__dirname, "src/sw.template.js");
  if (fs.existsSync(swTemplatePath)) {
    let swContent = fs.readFileSync(swTemplatePath, "utf-8");

    // 환경변수 치환
    Object.entries(envVars).forEach(([key, value]) => {
      const placeholder = `__${key}__`;
      swContent = swContent.replace(new RegExp(placeholder, "g"), value);
    });

    return swContent;
  }
  return null;
};

// Service Worker 환경변수 처리 플러그인
const serviceWorkerPlugin = (): Plugin => {
  return {
    name: "service-worker-env",
    configureServer(server: ViteDevServer) {
      // 개발 서버에서 /sw.js 요청 처리
      server.middlewares.use("/sw.js", (_req, res, next) => {
        const swContent = processServiceWorker();
        if (swContent) {
          res.setHeader(
            "Content-Type",
            "application/javascript; charset=utf-8"
          );
          res.setHeader("Service-Worker-Allowed", "/");
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
          // CORS 헤더 추가 (개발 환경용)
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");
          res.end(swContent);
        } else {
          next();
        }
      });
    },
    generateBundle() {
      // 빌드 시 Service Worker 파일 생성
      const swContent = processServiceWorker();
      if (swContent) {
        this.emitFile({
          type: "asset",
          fileName: "sw.js",
          source: swContent,
        });
      }
    },
  };
};

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
      serviceWorkerPlugin(),
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
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.html"),
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
