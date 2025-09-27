/**
 * Google Analytics 이벤트 및 카테고리 상수
 */

// GA 명령어 타입
export const GA_COMMANDS = {
  CONFIG: "config",
  EVENT: "event",
  JS: "js",
  SET: "set",
} as const;

// 이벤트 이름
export const GA_EVENTS = {
  PAGE_VIEW: "page_view",
  CLICK: "click",
  FORM_SUBMIT: "form_submit",
  SEARCH: "search",
  ENGAGEMENT: "engagement",
  EXCEPTION: "exception",
} as const;

// 이벤트 카테고리
export const GA_EVENT_CATEGORIES = {
  ENGAGEMENT: "engagement",
  BUTTON: "button",
  FORM: "form",
  SEARCH: "search",
  USER_ENGAGEMENT: "user_engagement",
  ERROR: "error",
  FORM_ERROR: "form_error",
  SCROLL_TRACKING: "scroll_tracking",
  ENGAGEMENT_TIME: "engagement_time",
  INTERACTION: "interaction",
} as const;

// 참여도 타입
export const GA_ENGAGEMENT_TYPES = {
  SCROLL: "scroll",
  TIME_ON_PAGE: "time_on_page",
  USER_INTERACTION: "user_interaction",
} as const;

// 상호작용 타입
export const GA_INTERACTION_TYPES = {
  CLICK: "click",
  KEYDOWN: "keydown",
} as const;

// 기본값
export const GA_DEFAULTS = {
  EVENT_CATEGORY: "engagement",
  FATAL: false,
  MAX_GTAG_WAIT_ATTEMPTS: 50,
  GTAG_CHECK_INTERVAL: 100,
  MAX_INTERACTIONS: 10,
  SCROLL_CHECK_INTERVAL: 5000,
} as const;

// 스크롤 임계값
export const GA_SCROLL_THRESHOLDS = {
  DEFAULT: 75,
} as const;

// 시간 추적 기본 간격 (초)
export const GA_TIME_INTERVALS = {
  DEFAULT: [30, 60, 120, 300],
} as const;

// 타입 정의
export type GACommand = (typeof GA_COMMANDS)[keyof typeof GA_COMMANDS];
export type GAEvent = (typeof GA_EVENTS)[keyof typeof GA_EVENTS];
export type GAEventCategory =
  (typeof GA_EVENT_CATEGORIES)[keyof typeof GA_EVENT_CATEGORIES];
export type GAEngagementType =
  (typeof GA_ENGAGEMENT_TYPES)[keyof typeof GA_ENGAGEMENT_TYPES];
export type GAInteractionType =
  (typeof GA_INTERACTION_TYPES)[keyof typeof GA_INTERACTION_TYPES];
