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
