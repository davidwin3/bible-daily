/**
 * 알림 관련 상수 정의
 */

// 알림 아이콘 및 이미지
export const NOTIFICATION_ICONS = {
  DEFAULT: "/icons/192.png",
  BADGE: "/icons/192.png",
} as const;

// 알림 타입
export const NOTIFICATION_TYPES = {
  DAILY_REMINDER: "daily-reminder",
  MISSION_DEADLINE: "mission-deadline",
  MISSION_REMINDER: "mission-reminder",
  ADMIN_TEST: "admin-test",
  CUSTOM: "custom",
} as const;

// 알림 토픽
export const NOTIFICATION_TOPICS = {
  NEW_MISSIONS: "new-missions",
  MISSION_REMINDERS: "mission-reminders",
  COMMUNITY_UPDATES: "community-updates",
  ANNOUNCEMENTS: "announcements",
} as const;

// 알림 태그
export const NOTIFICATION_TAGS = {
  DAILY_BIBLE_REMINDER: "daily-bible-reminder",
  DAILY_BIBLE_REMINDER_SNOOZE: "daily-bible-reminder-snooze",
  MISSION_REMINDER_LATER: "mission-reminder-later",
  ADMIN_TEST: "admin-test-notification",
  SCHEDULED: "scheduled-notification",
  DEFAULT: "bible-daily-notification",
} as const;

// 알림 액션
export const NOTIFICATION_ACTIONS = {
  OPEN: "open",
  CLOSE: "close",
  EXPLORE: "explore",
  VIEW_MISSIONS: "view-missions",
  VIEW_COMMUNITY: "view-community",
  VIEW_ANNOUNCEMENT: "view-announcement",
  COMPLETE_MISSION: "complete-mission",
  REMIND_LATER: "remind-later",
} as const;

// 알림 액션 라벨
export const NOTIFICATION_ACTION_LABELS = {
  OPEN: "열기",
  CLOSE: "닫기",
  EXPLORE: "확인하기",
  VIEW_MISSIONS: "미션 보기",
  VIEW_COMMUNITY: "커뮤니티 보기",
  VIEW_ANNOUNCEMENT: "공지사항 보기",
  COMPLETE_MISSION: "미션 완료하기",
  REMIND_LATER: "1시간 후 알림",
} as const;

// 알림 제목 및 메시지
export const NOTIFICATION_MESSAGES = {
  DAILY_REMINDER: {
    TITLE: "📖 성경 읽기 시간입니다!",
    BODY: "오늘의 성경 말씀을 읽어보세요. 하나님의 말씀으로 하루를 시작하세요.",
  },
  MISSION_REMINDER_LATER: {
    TITLE: "⏰ 미션 다시 알림",
    BODY: "미션을 완료할 시간입니다!",
  },
  BIBLE_READING_SNOOZE: {
    TITLE: "📖 성경 읽기 리마인더",
    BODY: "성경 읽기 시간입니다. 오늘의 말씀을 확인해보세요.",
  },
  DEFAULT: {
    TITLE: "Bible Daily",
    BODY: "새로운 알림이 있습니다.",
  },
} as const;

// 진동 패턴
export const VIBRATION_PATTERNS = {
  DEFAULT: [100, 50, 100],
  GENTLE: [50, 30, 50],
  STRONG: [200, 100, 200],
} as const;
