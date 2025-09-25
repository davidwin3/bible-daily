import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/theme";
import {
  THEME_TYPES,
  THEME_DISPLAY_NAMES,
  THEME_DESCRIPTIONS,
  type ThemeType,
} from "@/constants/theme";
import { Moon, Sun, Monitor, Check } from "lucide-react";

interface ThemeToggleProps {
  variant?: "button" | "dropdown";
  className?: string;
}

const getThemeIcon = (theme: ThemeType, resolvedTheme?: "light" | "dark") => {
  switch (theme) {
    case THEME_TYPES.LIGHT:
      return <Sun className="h-4 w-4" />;
    case THEME_TYPES.DARK:
      return <Moon className="h-4 w-4" />;
    case THEME_TYPES.SYSTEM:
      return <Monitor className="h-4 w-4" />;
    default:
      return resolvedTheme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      );
  }
};

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = "dropdown",
  className = "",
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  if (variant === "button") {
    // 간단한 토글 버튼 (라이트 <-> 다크)
    const toggleTheme = () => {
      setTheme(resolvedTheme === "dark" ? THEME_TYPES.LIGHT : THEME_TYPES.DARK);
    };

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className={`h-9 w-9 px-0 ${className}`}
        aria-label={`현재 ${
          resolvedTheme === "dark" ? "다크" : "라이트"
        } 모드, 클릭하여 변경`}
      >
        {resolvedTheme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
    );
  }

  // 드롭다운 버전 (라이트/다크/시스템)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`w-full justify-start ${className}`}
          aria-label={`현재 ${THEME_DISPLAY_NAMES[theme]}, 클릭하여 테마 변경`}
        >
          {getThemeIcon(theme, resolvedTheme)}
          <span className="ml-3">{THEME_DISPLAY_NAMES[theme]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        {Object.values(THEME_TYPES).map((themeOption) => (
          <DropdownMenuItem
            key={themeOption}
            onClick={() => setTheme(themeOption)}
            className="flex items-center justify-between cursor-pointer"
            role="menuitemradio"
            aria-checked={theme === themeOption}
          >
            <div className="flex items-center">
              {getThemeIcon(themeOption)}
              <div className="ml-3">
                <div className="font-medium">
                  {THEME_DISPLAY_NAMES[themeOption]}
                </div>
                <div className="text-sm text-muted-foreground">
                  {THEME_DESCRIPTIONS[themeOption]}
                </div>
              </div>
            </div>
            {theme === themeOption && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
