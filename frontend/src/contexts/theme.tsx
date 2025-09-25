import React, { createContext, useContext, useEffect, useState } from "react";
import {
  type ThemeType,
  THEME_TYPES,
  THEME_STORAGE_KEY,
} from "@/constants/theme";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  resolvedTheme: "light" | "dark"; // 실제 적용된 테마
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeType;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = THEME_TYPES.SYSTEM,
}) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    // localStorage에서 저장된 테마 설정 불러오기
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && Object.values(THEME_TYPES).includes(stored as ThemeType)) {
        return stored as ThemeType;
      }
    } catch (error) {
      console.warn("테마 설정을 불러오는 중 오류 발생:", error);
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (theme === THEME_TYPES.SYSTEM) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme === THEME_TYPES.DARK ? "dark" : "light";
  });

  // 시스템 테마 변경 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === THEME_TYPES.SYSTEM) {
        const newResolvedTheme = mediaQuery.matches ? "dark" : "light";
        setResolvedTheme(newResolvedTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // 테마 변경 시 DOM 클래스 업데이트
  useEffect(() => {
    const root = document.documentElement;

    // 기존 테마 클래스 제거
    root.classList.remove("light", "dark");

    // 새 테마 클래스 추가
    root.classList.add(resolvedTheme);

    // 메타 테마 컬러 업데이트 (모바일 브라우저)
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute(
        "content",
        resolvedTheme === "dark" ? "#0a0a0a" : "#ffffff"
      );
    }
  }, [resolvedTheme]);

  const setTheme = (newTheme: ThemeType) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.warn("테마 설정을 저장하는 중 오류 발생:", error);
    }

    setThemeState(newTheme);

    // resolvedTheme 즉시 업데이트
    if (newTheme === THEME_TYPES.SYSTEM) {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setResolvedTheme(systemDark ? "dark" : "light");
    } else {
      setResolvedTheme(newTheme === THEME_TYPES.DARK ? "dark" : "light");
    }
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
