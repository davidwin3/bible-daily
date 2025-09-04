// Firebase Messaging Service Worker

import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// Firebase 설정
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Messaging 인스턴스 가져오기
const messaging = getMessaging(app);

// 백그라운드 메시지 처리
onBackgroundMessage(messaging, (payload) => {
  console.log("Received background message:", payload);

  const notificationTitle = payload.notification?.title || "Bible Daily";
  const notificationOptions = {
    body: payload.notification?.body || "새로운 알림이 있습니다.",
    icon: "/vite.svg",
    badge: "/vite.svg",
    tag: "bible-daily-notification",
    data: payload.data || {},
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
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
