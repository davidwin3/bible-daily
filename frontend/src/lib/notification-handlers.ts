/**
 * 토픽별 알림 처리 로직
 * FCM에서 받은 알림 데이터를 기반으로 토픽별 처리를 담당
 */

import {
  NOTIFICATION_TOPICS,
  type NotificationTopic,
} from "./notification-topics";

// 알림 데이터 인터페이스
export interface NotificationData {
  topic?: string;
  notificationType?: string;
  timestamp?: string;
  [key: string]: any;
}

// 토픽별 라우팅 정보
export interface TopicRouting {
  url: string;
  requiresAuth?: boolean;
  openInNewTab?: boolean;
}

// 토픽별 설정
export const TOPIC_CONFIGS: Record<
  NotificationTopic,
  {
    routing: TopicRouting;
    icon: string;
    badge: string;
    tag: string;
    actions: Array<{
      action: string;
      title: string;
      icon?: string;
    }>;
    requireInteraction?: boolean;
  }
> = {
  [NOTIFICATION_TOPICS.NEW_MISSIONS]: {
    routing: {
      url: "/missions",
      requiresAuth: false,
    },
    icon: "/vite.svg",
    badge: "/vite.svg",
    tag: "new-missions",
    actions: [
      {
        action: "view-missions",
        title: "미션 보기",
        icon: "/vite.svg",
      },
      {
        action: "close",
        title: "닫기",
        icon: "/vite.svg",
      },
    ],
    requireInteraction: true,
  },

  [NOTIFICATION_TOPICS.MISSION_REMINDERS]: {
    routing: {
      url: "/missions",
      requiresAuth: false,
    },
    icon: "/vite.svg",
    badge: "/vite.svg",
    tag: "mission-reminders",
    actions: [
      {
        action: "complete-mission",
        title: "미션 완료하기",
        icon: "/vite.svg",
      },
      {
        action: "remind-later",
        title: "1시간 후 알림",
        icon: "/vite.svg",
      },
      {
        action: "close",
        title: "닫기",
        icon: "/vite.svg",
      },
    ],
    requireInteraction: false,
  },

  [NOTIFICATION_TOPICS.COMMUNITY_UPDATES]: {
    routing: {
      url: "/posts",
      requiresAuth: false,
    },
    icon: "/vite.svg",
    badge: "/vite.svg",
    tag: "community-updates",
    actions: [
      {
        action: "view-community",
        title: "커뮤니티 보기",
        icon: "/vite.svg",
      },
      {
        action: "close",
        title: "닫기",
        icon: "/vite.svg",
      },
    ],
    requireInteraction: false,
  },

  [NOTIFICATION_TOPICS.ANNOUNCEMENTS]: {
    routing: {
      url: "/",
      requiresAuth: false,
    },
    icon: "/vite.svg",
    badge: "/vite.svg",
    tag: "announcements",
    actions: [
      {
        action: "view-announcement",
        title: "공지사항 보기",
        icon: "/vite.svg",
      },
      {
        action: "close",
        title: "닫기",
        icon: "/vite.svg",
      },
    ],
    requireInteraction: true,
  },
};

/**
 * 토픽이 유효한지 확인
 */
export const isValidNotificationTopic = (
  topic: string
): topic is NotificationTopic => {
  return Object.values(NOTIFICATION_TOPICS).includes(
    topic as NotificationTopic
  );
};

/**
 * 알림 데이터에서 토픽 추출
 */
export const getTopicFromNotificationData = (
  data: NotificationData
): NotificationTopic | null => {
  const topic = data?.topic;
  if (topic && isValidNotificationTopic(topic)) {
    return topic;
  }
  return null;
};

/**
 * 토픽별 알림 옵션 생성
 */
export const createTopicNotificationOptions = (
  topic: NotificationTopic,
  _title: string,
  body: string,
  data?: NotificationData
): NotificationOptions => {
  const config = TOPIC_CONFIGS[topic];

  return {
    body,
    icon: config.icon,
    badge: config.badge,
    tag: config.tag,
    data: {
      ...data,
      topic,
      dateOfArrival: Date.now(),
      primaryKey: "bible-daily",
    },
    actions: config.actions,
    requireInteraction: config.requireInteraction,
    silent: false,
  } as NotificationOptions;
};

/**
 * 토픽별 라우팅 URL 가져오기
 */
export const getTopicRoutingUrl = (
  topic: NotificationTopic,
  action?: string,
  _data?: NotificationData
): string => {
  const config = TOPIC_CONFIGS[topic];

  // 액션별 특별한 라우팅이 있다면 처리
  switch (action) {
    case "view-missions":
    case "complete-mission":
      return "/missions";
    case "view-community":
      return "/posts";
    case "view-announcement":
      return "/";
    default:
      return config.routing.url;
  }
};

/**
 * 기본 알림 옵션 (토픽이 없는 경우)
 */
export const createDefaultNotificationOptions = (
  _title: string,
  body: string,
  data?: NotificationData
): NotificationOptions => {
  return {
    body,
    icon: "/vite.svg",
    badge: "/vite.svg",
    tag: "bible-daily-notification",
    data: {
      ...data,
      dateOfArrival: Date.now(),
      primaryKey: "bible-daily",
    },
    actions: [
      {
        action: "explore",
        title: "확인하기",
        icon: "/vite.svg",
      },
      {
        action: "close",
        title: "닫기",
        icon: "/vite.svg",
      },
    ],
    requireInteraction: false,
    silent: false,
  } as NotificationOptions;
};

/**
 * 알림 클릭 액션 처리
 */
export const handleNotificationAction = (
  action: string,
  topic: NotificationTopic | null,
  data?: NotificationData
): string => {
  // 공통 액션 처리
  if (action === "close") {
    return "";
  }

  // 토픽별 액션 처리
  if (topic) {
    if (
      action === "remind-later" &&
      topic === NOTIFICATION_TOPICS.MISSION_REMINDERS
    ) {
      // 1시간 후 다시 알림 (Service Worker에서 처리)
      return "remind-later";
    }

    return getTopicRoutingUrl(topic, action, data);
  }

  // 기본 처리
  return "/";
};
