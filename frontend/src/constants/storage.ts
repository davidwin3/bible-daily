/**
 * 스토리지 관련 상수 정의
 */

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  NOTIFICATION_SETTINGS: "notificationSettings",
  NOTIFICATION_ENABLED: "notificationEnabled",
  NOTIFICATION_PERMISSION_REQUESTED: "notificationPermissionRequested",
  TIMER_ID: "daily-reminder-timer-id",
} as const;
