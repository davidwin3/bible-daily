// 테마 관련 상수
export const THEME_TYPES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;

export const THEME_STORAGE_KEY = "bible-daily-theme";

export const THEME_DISPLAY_NAMES = {
  [THEME_TYPES.LIGHT]: "라이트 모드",
  [THEME_TYPES.DARK]: "다크 모드",
  [THEME_TYPES.SYSTEM]: "시스템 설정",
} as const;

export const THEME_DESCRIPTIONS = {
  [THEME_TYPES.LIGHT]: "밝은 테마로 설정합니다",
  [THEME_TYPES.DARK]: "어두운 테마로 설정합니다",
  [THEME_TYPES.SYSTEM]: "시스템 설정을 따릅니다",
} as const;

export type ThemeType = (typeof THEME_TYPES)[keyof typeof THEME_TYPES];
