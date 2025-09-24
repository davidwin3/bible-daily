/**
 * 동기화 관련 상수 정의
 */

// 백그라운드 동기화 태그
export const SYNC_TAGS = {
  BACKGROUND_CHECK: "background-notification-check",
  DAILY_CHECK: "daily-notification-check",
} as const;

// 메시지 타입 (서비스 워커 통신용)
export const MESSAGE_TYPES = {
  SCHEDULE_NOTIFICATION: "SCHEDULE_NOTIFICATION",
  CANCEL_NOTIFICATIONS: "CANCEL_NOTIFICATIONS",
  TRIGGER_BACKGROUND_CHECK: "TRIGGER_BACKGROUND_CHECK",
  NAVIGATE: "navigate",
} as const;

// 권한 관련
export const PERMISSIONS = {
  PERIODIC_BACKGROUND_SYNC: "periodic-background-sync",
} as const;
