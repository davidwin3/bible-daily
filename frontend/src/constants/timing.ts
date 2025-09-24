/**
 * 시간 관련 상수 정의
 */

// 타이머 및 간격 설정
export const TIMING = {
  PERIODIC_SYNC_INTERVAL: 60 * 60 * 1000, // 1시간
  REMIND_LATER_DELAY: 60 * 60 * 1000, // 1시간 후
  CACHE_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7일
  FALLBACK_TIMER_THRESHOLD: 24 * 60 * 60 * 1000, // 24시간
} as const;
