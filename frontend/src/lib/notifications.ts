import { api } from "./api";
import type { NotificationTopic } from "./notification-topics";

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  icon?: string;
  badge?: string;
  clickAction?: string;
}

/**
 * FCM 토큰으로 알림 전송 (관리자 전용)
 */
export const sendNotificationToToken = async (
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  const payload: NotificationPayload = {
    title,
    body,
    data: {
      type: "admin-test",
      timestamp: new Date().toISOString(),
      ...data,
    },
    icon: "/vite.svg",
    badge: "/vite.svg",
  };

  const response = await api.post("/notifications/send-to-token", {
    fcmToken,
    payload,
  });

  if (!response.data.success) {
    throw new Error(response.data.error || "Failed to send notification");
  }
};

/**
 * 사용자 ID로 알림 전송 (관리자 전용)
 */
export const sendNotificationToUser = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  const payload: NotificationPayload = {
    title,
    body,
    data: {
      type: "admin-test",
      timestamp: new Date().toISOString(),
      ...data,
    },
    icon: "/vite.svg",
    badge: "/vite.svg",
  };

  const response = await api.post("/notifications/send-to-user", {
    userId,
    payload,
  });

  if (!response.data.success) {
    throw new Error(response.data.error || "Failed to send notification");
  }
};

/**
 * 테스트 알림 전송 (자신에게)
 */
export const sendTestNotification = async (): Promise<void> => {
  const response = await api.post("/notifications/test");

  if (!response.data.success) {
    throw new Error(response.data.error || "Failed to send test notification");
  }
};

/**
 * FCM 토큰 구독
 */
export const subscribeFcmToken = async (fcmToken: string): Promise<void> => {
  const response = await api.post("/notifications/subscribe", {
    fcmToken,
  });

  if (!response.data.success) {
    throw new Error("Failed to subscribe FCM token");
  }
};

/**
 * FCM 토큰 구독 해제
 */
export const unsubscribeFcmToken = async (fcmToken: string): Promise<void> => {
  const response = await api.delete("/notifications/unsubscribe", {
    data: { fcmToken },
  });

  if (!response.data.success) {
    throw new Error("Failed to unsubscribe FCM token");
  }
};

/**
 * 토픽 구독
 */
export const subscribeToTopic = async (
  topic: NotificationTopic
): Promise<void> => {
  const response = await api.post("/notifications/subscribe-topic", {
    topic,
  });

  if (!response.data.success) {
    throw new Error(response.data.error || "Failed to subscribe to topic");
  }
};

/**
 * 토픽 구독 해제
 */
export const unsubscribeFromTopic = async (
  topic: NotificationTopic
): Promise<void> => {
  const response = await api.post("/notifications/unsubscribe-topic", {
    topic,
  });

  if (!response.data.success) {
    throw new Error(response.data.error || "Failed to unsubscribe from topic");
  }
};

/**
 * 토픽에 알림 전송 (관리자 전용)
 */
export const sendNotificationToTopic = async (
  topic: NotificationTopic,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  const payload: NotificationPayload = {
    title,
    body,
    data: {
      type: "admin-test",
      timestamp: new Date().toISOString(),
      ...data,
    },
    icon: "/vite.svg",
    badge: "/vite.svg",
  };

  const response = await api.post("/notifications/send-to-topic", {
    topic,
    payload,
  });

  if (!response.data.success) {
    throw new Error(
      response.data.error || "Failed to send notification to topic"
    );
  }
};
