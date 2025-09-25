# 테마 시스템 가이드

Bible Daily 앱의 테마 시스템은 라이트/다크 모드와 시스템 설정 따라가기를 지원합니다.

## 🎨 주요 기능

### 테마 옵션

- **라이트 모드**: 밝은 테마
- **다크 모드**: 어두운 테마
- **시스템 설정**: 사용자의 OS 설정을 따라가며, 시스템 테마 변경 시 자동으로 반영

### 접근 방법

1. **헤더의 테마 토글 버튼**: 라이트/다크 모드 간단 전환
2. **프로필 설정 메뉴**: 라이트/다크/시스템 모든 옵션 선택 가능

## 🔧 개발자 가이드

### 테마 Hook 사용법

```typescript
import { useTheme } from "@/hooks/useTheme";

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // 현재 설정된 테마 ('light' | 'dark' | 'system')
  console.log(theme);

  // 실제 적용된 테마 ('light' | 'dark')
  console.log(resolvedTheme);

  // 테마 변경
  setTheme("dark");
}
```

### 테마 상수 사용법

```typescript
import { THEME_TYPES, THEME_DISPLAY_NAMES } from "@/constants/theme";

// 테마 타입
const currentTheme = THEME_TYPES.DARK; // 'dark'

// 표시명
const displayName = THEME_DISPLAY_NAMES[THEME_TYPES.DARK]; // '다크 모드'
```

### 컴포넌트에서 테마 조건부 렌더링

```typescript
function MyComponent() {
  const { resolvedTheme } = useTheme();

  return (
    <div className={resolvedTheme === "dark" ? "text-white" : "text-black"}>
      {/* 또는 Tailwind dark: 클래스 사용 */}
      <span className="text-gray-900 dark:text-gray-100">
        테마에 따라 자동 변경되는 텍스트
      </span>
    </div>
  );
}
```

## 🎯 구현 세부사항

### 테마 영속화

- 사용자의 테마 설정은 `localStorage`에 `bible-daily-theme` 키로 저장
- 페이지 새로고침 시에도 설정 유지

### 깜빡임 방지

- `index.html`에 인라인 스크립트로 테마를 즉시 적용
- React 앱 로딩 전에 테마 클래스가 적용되어 깜빡임 없는 사용자 경험 제공

### 시스템 테마 감지

- `window.matchMedia('(prefers-color-scheme: dark)')`로 시스템 테마 감지
- 시스템 테마 변경 시 실시간 반영 (system 모드일 때)

### PWA 지원

- 모바일 브라우저의 상태바 색상도 테마에 따라 자동 변경
- `meta[name="theme-color"]` 동적 업데이트

## 🎨 CSS 변수 시스템

테마는 CSS 변수 기반으로 작동하며, Tailwind CSS의 색상 시스템과 연동됩니다:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  /* ... 기타 라이트 테마 변수 */
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  /* ... 기타 다크 테마 변수 */
}
```

이를 통해 `bg-background`, `text-foreground` 등의 Tailwind 클래스가 테마에 따라 자동으로 변경됩니다.

## 📱 모바일 최적화

- 터치 인터페이스에 최적화된 드롭다운 메뉴
- iOS/Android 네이티브 앱과 일관된 테마 전환 경험
- PWA 환경에서 상태바 색상 자동 조정
