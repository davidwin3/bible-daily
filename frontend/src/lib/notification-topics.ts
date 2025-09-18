/**
 * FCM 토픽 상수 정의 (프론트엔드)
 * Firebase Cloud Messaging에서 사용되는 토픽들을 타입 안전하게 관리
 */

// 토픽 상수 정의 (백엔드와 동일)
export const NOTIFICATION_TOPICS = {
  NEW_MISSIONS: "new-missions",
  MISSION_REMINDERS: "mission-reminders",
  COMMUNITY_UPDATES: "community-updates",
  ANNOUNCEMENTS: "announcements",
} as const;

// 토픽 타입 정의
export type NotificationTopic =
  (typeof NOTIFICATION_TOPICS)[keyof typeof NOTIFICATION_TOPICS];

// 토픽별 설명 정보
export interface TopicInfo {
  id: NotificationTopic;
  name: string;
  description: string;
  isSubscribed: boolean;
  isEssential?: boolean;
}

export const TOPIC_DESCRIPTIONS: Record<
  NotificationTopic,
  Omit<TopicInfo, "isSubscribed">
> = {
  [NOTIFICATION_TOPICS.NEW_MISSIONS]: {
    id: NOTIFICATION_TOPICS.NEW_MISSIONS,
    name: "새로운 미션 알림",
    description: "새로운 성경 읽기 미션이 등록될 때 알림을 받습니다",
    isEssential: true,
  },
  [NOTIFICATION_TOPICS.MISSION_REMINDERS]: {
    id: NOTIFICATION_TOPICS.MISSION_REMINDERS,
    name: "미션 리마인더",
    description: "미션 마감 전 리마인더 알림을 받습니다",
    isEssential: false,
  },
  [NOTIFICATION_TOPICS.COMMUNITY_UPDATES]: {
    id: NOTIFICATION_TOPICS.COMMUNITY_UPDATES,
    name: "커뮤니티 소식",
    description: "새로운 게시글이나 댓글 등 커뮤니티 활동 알림을 받습니다",
    isEssential: false,
  },
  [NOTIFICATION_TOPICS.ANNOUNCEMENTS]: {
    id: NOTIFICATION_TOPICS.ANNOUNCEMENTS,
    name: "공지사항",
    description: "중요한 공지사항과 업데이트 소식을 받습니다",
    isEssential: false,
  },
};

// 필수 토픽 목록 (구독 해제 불가)
export const ESSENTIAL_TOPICS: NotificationTopic[] = [
  NOTIFICATION_TOPICS.NEW_MISSIONS,
];

// 토픽 유효성 검사 함수
export const isValidTopic = (topic: string): topic is NotificationTopic => {
  return Object.values(NOTIFICATION_TOPICS).includes(
    topic as NotificationTopic
  );
};

// 모든 토픽 목록 반환
export const getAllTopics = (): NotificationTopic[] => {
  return Object.values(NOTIFICATION_TOPICS);
};

// 토픽 정보를 배열로 반환 (UI에서 사용)
export const getTopicInfoList = (
  subscriptionStatus: Partial<Record<NotificationTopic, boolean>> = {}
): TopicInfo[] => {
  return getAllTopics().map((topic) => ({
    ...TOPIC_DESCRIPTIONS[topic],
    isSubscribed: subscriptionStatus[topic] ?? false,
  }));
};
