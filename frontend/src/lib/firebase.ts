import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase 설정
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Auth 인스턴스 생성
export const auth = getAuth(app);

// Google Auth Provider 생성
export const googleProvider = new GoogleAuthProvider();

// Messaging 인스턴스 생성 (브라우저 환경에서만)
let messaging: ReturnType<typeof getMessaging> | null = null;

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  messaging = getMessaging(app);
}

export { app, messaging, VAPID_KEY };

/**
 * FCM 토큰 가져오기
 */
export async function getFCMToken(): Promise<string | null> {
  if (!messaging) {
    console.warn("Messaging not supported in this environment");
    return null;
  }

  try {
    // Service Worker 등록 확인
    const registration = await navigator.serviceWorker.ready;

    // FCM 토큰 가져오기
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("FCM Token:", token);
      return token;
    } else {
      console.log("No registration token available.");
      return null;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token:", error);
    return null;
  }
}

/**
 * 포그라운드 메시지 수신 설정
 */
export function setupForegroundMessageListener() {
  if (!messaging) {
    console.warn("Messaging not supported in this environment");
    return;
  }

  onMessage(messaging, (payload) => {
    console.log("Message received in foreground:", payload);

    // Service Worker를 통해 알림 표시
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(
          payload.notification?.title || "Bible Daily",
          {
            body: payload.notification?.body || "새로운 알림이 있습니다.",
            icon: "/vite.svg",
            badge: "/vite.svg",
            tag: "bible-daily-notification",
            data: payload.data,
          }
        );
      });
    }
  });
}

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    console.warn("Notification permission denied");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}
