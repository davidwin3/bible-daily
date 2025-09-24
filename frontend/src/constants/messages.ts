/**
 * 로그 및 에러 메시지 상수 정의
 */

// 로그 메시지 상수
export const LOG_MESSAGES = {
  BACKGROUND_CHECK_START: "🔄 백그라운드 알림 체크 시작",
  PERIODIC_CHECK_START: "🔄 주기적 알림 체크 시작",
  NOTIFICATION_SAVED: "💾 알림 스케줄 저장됨:",
  NOTIFICATION_DELETED: "🗑️ 알림 스케줄 삭제됨:",
  BACKGROUND_NOTIFICATION_SENT: "📱 백그라운드 알림 발송:",
  BACKGROUND_SYNC_REQUESTED: "🔄 백그라운드 동기화 요청됨",
  PERIODIC_SYNC_REGISTERED: "🔄 주기적 백그라운드 동기화 등록됨",
  PERIODIC_SYNC_NO_PERMISSION: "⚠️ 주기적 백그라운드 동기화 권한이 없습니다",
  OLD_NOTIFICATIONS_CLEANED: "🧹 ${count}개의 오래된 알림이 정리되었습니다.",
  NOTIFICATION_CLOSED: "알림이 닫혔습니다.",
  REMIND_LATER_SET: "1시간 후 다시 알림이 설정되었습니다.",
  NOTIFICATIONS_CANCELLED: "${type} 타입의 알림들이 취소되었습니다.",
  NOTIFICATION_POSTPONED: "⏰ 알림이 방해 금지 시간 이후로 연기되었습니다:",
  BACKGROUND_SCHEDULE_DELETED: "🗑️ 백그라운드 알림 스케줄이 삭제되었습니다.",
  APP_TIMER_CANCELLED: "⏰ 앱 내 타이머가 취소되었습니다.",
  DAILY_REMINDER_CANCELLED: "📖 매일 성경 읽기 알림이 취소되었습니다.",
  DAILY_REMINDER_SHOWN: "📖 매일 성경 읽기 알림을 표시했습니다.",
  FALLBACK_TIMER_SET: "⏰ 앱 내 폴백 타이머도 설정됨:",
  FALLBACK_MODE: "⚠️ 폴백 타이머 설정됨:",
  BACKGROUND_SCHEDULED: "📅 백그라운드 알림이 스케줄되었습니다:",
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
  BACKGROUND_CHECK_ERROR: "❌ 백그라운드 알림 체크 오류:",
  BACKGROUND_SYNC_FAILED: "❌ 백그라운드 동기화 요청 실패:",
  PERIODIC_SYNC_FAILED: "❌ 주기적 백그라운드 동기화 등록 실패:",
  NOTIFICATION_SCHEDULE_ERROR: "❌ 알림 스케줄링 오류:",
  NOTIFICATION_DELETE_ERROR: "❌ 백그라운드 알림 삭제 오류:",
  NOTIFICATION_CANCEL_ERROR: "알림 취소 오류:",
} as const;
