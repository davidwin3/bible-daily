// Firebase Messaging Service Worker

import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// Firebase 설정 (빌드 시 환경변수로 치환됨)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Messaging 인스턴스 가져오기
const messaging = getMessaging(app);

// 관리자 테스트 알림 옵션 생성 함수
function createAdminTestNotificationOptions(
  notificationBody,
  notificationData
) {
  return {
    body: notificationBody,
    icon: "/icons/192.png",
    badge: "/icons/192.png",
    tag: "admin-test-notification",
    data: {
      ...notificationData,
      dateOfArrival: Date.now(),
      primaryKey: "bible-daily",
    },
    actions: [
      {
        action: "explore",
        title: "확인하기",
        icon: "/icons/192.png",
      },
      {
        action: "close",
        title: "닫기",
        icon: "/icons/192.png",
      },
    ],
    requireInteraction: true,
    silent: false,
  };
}

// 백그라운드 메시지 처리
onBackgroundMessage(messaging, (payload) => {
  console.log("Received background message:", payload);

  const notificationTitle = payload.notification?.title || "Bible Daily";
  const notificationBody =
    payload.notification?.body || "새로운 알림이 있습니다.";
  const notificationData = payload.data || {};
  const topic = notificationData.topic;
  const notificationType = notificationData.type;

  let notificationOptions;

  // 관리자 테스트 알림 처리
  if (notificationType === "admin-test") {
    notificationOptions = createAdminTestNotificationOptions(
      notificationBody,
      notificationData
    );
  }
  // 토픽별 알림 처리
  else if (topic) {
    const topicConfigs = {
      "new-missions": {
        tag: "new-missions",
        actions: [
          {
            action: "view-missions",
            title: "미션 보기",
            icon: "/icons/192.png",
          },
          { action: "close", title: "닫기", icon: "/icons/192.png" },
        ],
        requireInteraction: true,
      },
      "mission-reminders": {
        tag: "mission-reminders",
        actions: [
          {
            action: "complete-mission",
            title: "미션 완료하기",
            icon: "/icons/192.png",
          },
          {
            action: "remind-later",
            title: "1시간 후 알림",
            icon: "/icons/192.png",
          },
          { action: "close", title: "닫기", icon: "/icons/192.png" },
        ],
        requireInteraction: false,
      },
      "community-updates": {
        tag: "community-updates",
        actions: [
          {
            action: "view-community",
            title: "커뮤니티 보기",
            icon: "/icons/192.png",
          },
          { action: "close", title: "닫기", icon: "/icons/192.png" },
        ],
        requireInteraction: false,
      },
      announcements: {
        tag: "announcements",
        actions: [
          {
            action: "view-announcement",
            title: "공지사항 보기",
            icon: "/icons/192.png",
          },
          { action: "close", title: "닫기", icon: "/icons/192.png" },
        ],
        requireInteraction: true,
      },
    };

    const config = topicConfigs[topic];
    if (config) {
      notificationOptions = {
        body: notificationBody,
        icon: "/icons/192.png",
        badge: "/icons/192.png",
        tag: config.tag,
        data: {
          ...notificationData,
          dateOfArrival: Date.now(),
          primaryKey: "bible-daily",
        },
        actions: config.actions,
        requireInteraction: config.requireInteraction,
        silent: false,
      };
    }
  }

  // 기본 알림 설정 (토픽이 없거나 인식되지 않는 경우)
  if (!notificationOptions) {
    notificationOptions = {
      body: notificationBody,
      icon: "/icons/192.png",
      badge: "/icons/192.png",
      tag: "bible-daily-notification",
      data: {
        ...notificationData,
        dateOfArrival: Date.now(),
        primaryKey: "bible-daily",
      },
      actions: [
        {
          action: "explore",
          title: "확인하기",
          icon: "/icons/192.png",
        },
        {
          action: "close",
          title: "닫기",
          icon: "/icons/192.png",
        },
      ],
      requireInteraction: false,
      silent: false,
    };
  }

  self.registration.showNotification(notificationTitle, notificationOptions);
});
