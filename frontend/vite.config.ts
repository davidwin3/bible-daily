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
      const metaEnvPattern = `process\\.env\\.${key}`;
      swContent = swContent.replace(
        new RegExp(metaEnvPattern, "g"),
        `"${value}"`
      );
    });

    return swContent;
  }
  return null;
};

// Firebase Messaging Service Worker 환경변수 처리 함수
const processFirebaseMessagingServiceWorker = () => {
  const envVars = {
    VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || "",
    VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || "",
    VITE_FIREBASE_STORAGE_BUCKET:
      process.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    VITE_FIREBASE_MESSAGING_SENDER_ID:
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || "",
  };

  const firebaseSwTemplatePath = path.resolve(
    __dirname,
    "src/firebase-messaging-sw.template.js"
  );
  if (fs.existsSync(firebaseSwTemplatePath)) {
    let firebaseSwContent = fs.readFileSync(firebaseSwTemplatePath, "utf-8");

    // import.meta.env를 실제 환경변수 값으로 치환
    Object.entries(envVars).forEach(([key, value]) => {
      const metaEnvPattern = `process\\.env\\.${key}`;
      firebaseSwContent = firebaseSwContent.replace(
        new RegExp(metaEnvPattern, "g"),
        `"${value}"`
      );
    });

    return firebaseSwContent;
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

      // 개발 서버에서 /firebase-messaging-sw.js 요청 처리
      server.middlewares.use("/firebase-messaging-sw.js", (_req, res, next) => {
        const firebaseSwContent = processFirebaseMessagingServiceWorker();
        if (firebaseSwContent) {
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
          res.end(firebaseSwContent);
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

      // 빌드 시 Firebase Messaging Service Worker 파일 생성
      const firebaseSwContent = processFirebaseMessagingServiceWorker();
      if (firebaseSwContent) {
        this.emitFile({
          type: "asset",
          fileName: "firebase-messaging-sw.js",
          source: firebaseSwContent,
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
