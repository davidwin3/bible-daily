import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { api } from "@/lib/api";

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
        const notificationTitle = payload.notification?.title || "Bible Daily";
        const notificationBody =
          payload.notification?.body || "새로운 알림이 있습니다.";
        const notificationData = payload.data || {};

        // 토픽 정보를 포함한 알림 옵션 생성
        const options = {
          body: notificationBody,
          icon: "/vite.svg",
          badge: "/vite.svg",
          tag: notificationData.topic
            ? `${notificationData.topic}-foreground`
            : "bible-daily-notification",
          vibrate: [100, 50, 100],
          data: {
            ...notificationData,
            dateOfArrival: Date.now(),
            primaryKey: "bible-daily",
            source: "foreground",
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
        };

        registration.showNotification(notificationTitle, options);
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

/**
 * 자동으로 FCM 토큰을 등록하는 함수
 * 이미 알림 권한이 있는 경우에만 실행됩니다.
 */
export async function autoRegisterFCMToken(): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  try {
    // 알림 권한이 없으면 토큰 등록하지 않음
    if (Notification.permission !== "granted") {
      console.log(
        "Notification permission not granted, skipping FCM token registration"
      );
      return { success: false, error: "Permission not granted" };
    }

    // FCM 토큰 가져오기
    const token = await getFCMToken();

    if (!token) {
      console.log("FCM token not available");
      return { success: false, error: "Token not available" };
    }

    // 인증 토큰 확인
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.log("No auth token available");
      return { success: false, error: "No auth token" };
    }

    // 서버에 토큰 등록
    const response = await api.post("/notifications/subscribe", {
      fcmToken: token,
    });

    if (response.status === 200) {
      console.log("FCM token registered successfully:", token);
      return { success: true, token };
    } else {
      const error = await response.data;
      console.error("Failed to register FCM token:", error);
      return { success: false, error };
    }
  } catch (error) {
    console.error("Error during FCM token registration:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
