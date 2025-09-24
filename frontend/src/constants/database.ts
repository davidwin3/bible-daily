/**
 * 데이터베이스 관련 상수 정의
 */

// IndexedDB 설정
export const DB_CONFIG = {
  NAME: "BibleDailyNotifications",
  VERSION: 1,
  STORE_NAME: "notifications",
  INDEXES: {
    SCHEDULE_TIME: "scheduleTime",
    TYPE: "type",
    SENT: "sent",
  },
} as const;
