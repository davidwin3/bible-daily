/// <reference types="vite/client" />

// Locator.js 타입 정의
declare global {
  const __LOCATOR__: boolean | undefined;
}

interface ImportMetaEnv {
  readonly VITE_PROJECT_PATH?: string;
  // 기존 환경 변수들...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
