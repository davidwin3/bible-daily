/**
 * FCM 토픽 상수 정의
 * Firebase Cloud Messaging에서 사용되는 토픽들을 타입 안전하게 관리
 */

// 토픽 상수 정의
export const NOTIFICATION_TOPICS = {
  NEW_MISSIONS: 'new-missions',
  MISSION_REMINDERS: 'mission-reminders',
  COMMUNITY_UPDATES: 'community-updates',
  ANNOUNCEMENTS: 'announcements',
} as const;

// 토픽 타입 정의
export type NotificationTopic =
  (typeof NOTIFICATION_TOPICS)[keyof typeof NOTIFICATION_TOPICS];

// 토픽별 설명 정보
export const TOPIC_DESCRIPTIONS = {
  [NOTIFICATION_TOPICS.NEW_MISSIONS]: {
    name: '새로운 미션 알림',
    description: '새로운 성경 읽기 미션이 등록될 때 알림을 받습니다',
    isEssential: true,
  },
  [NOTIFICATION_TOPICS.MISSION_REMINDERS]: {
    name: '미션 리마인더',
    description: '미션 마감 전 리마인더 알림을 받습니다',
    isEssential: false,
  },
  [NOTIFICATION_TOPICS.COMMUNITY_UPDATES]: {
    name: '커뮤니티 소식',
    description: '새로운 게시글이나 댓글 등 커뮤니티 활동 알림을 받습니다',
    isEssential: false,
  },
  [NOTIFICATION_TOPICS.ANNOUNCEMENTS]: {
    name: '공지사항',
    description: '중요한 공지사항과 업데이트 소식을 받습니다',
    isEssential: false,
  },
} as const;

// 필수 토픽 목록 (구독 해제 불가)
export const ESSENTIAL_TOPICS: NotificationTopic[] = [
  NOTIFICATION_TOPICS.NEW_MISSIONS,
];

// 토픽 유효성 검사 함수
export const isValidTopic = (topic: string): topic is NotificationTopic => {
  return Object.values(NOTIFICATION_TOPICS).includes(
    topic as NotificationTopic,
  );
};

// 모든 토픽 목록 반환
export const getAllTopics = (): NotificationTopic[] => {
  return Object.values(NOTIFICATION_TOPICS);
};
