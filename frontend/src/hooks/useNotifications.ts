import { useState, useEffect, useCallback } from "react";

interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    permission: "default",
    isSupported: false,
    registration: null,
  });

  useEffect(() => {
    // 브라우저 알림 지원 확인
    const isSupported =
      "Notification" in window && "serviceWorker" in navigator;

    setState((prev) => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : "denied",
    }));

    // Service Worker 등록
    if (isSupported) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);

      setState((prev) => ({
        ...prev,
        registration,
      }));
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  };

  const requestPermission =
    useCallback(async (): Promise<NotificationPermission> => {
      if (!state.isSupported) {
        return "denied";
      }

      try {
        const permission = await Notification.requestPermission();
        setState((prev) => ({
          ...prev,
          permission,
        }));
        return permission;
      } catch (error) {
        console.error("Failed to request notification permission:", error);
        return "denied";
      }
    }, [state.isSupported]);

  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (state.permission !== "granted" || !state.registration) {
        console.warn("Notifications not available");
        return;
      }

      try {
        await state.registration.showNotification(title, {
          icon: "/vite.svg",
          badge: "/vite.svg",
          // vibrate: [100, 50, 100], // TypeScript에서 지원하지 않는 속성
          ...options,
        });
      } catch (error) {
        console.error("Failed to show notification:", error);
      }
    },
    [state.permission, state.registration]
  );

  const scheduleLocalNotification = useCallback(
    (
      title: string,
      body: string,
      delay: number // milliseconds
    ) => {
      if (state.permission !== "granted") {
        console.warn("Notification permission not granted");
        return;
      }

      setTimeout(() => {
        showNotification(title, { body });
      }, delay);
    },
    [state.permission, showNotification]
  );

  const subscribeToPush =
    useCallback(async (): Promise<PushSubscription | null> => {
      if (!state.registration || state.permission !== "granted") {
        return null;
      }

      try {
        // VAPID 키는 실제 구현에서 환경변수로 관리해야 함
        const vapidPublicKey = "YOUR_VAPID_PUBLIC_KEY";

        const subscription = await state.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });

        // 서버에 구독 정보 전송
        // await api.post('/notifications/subscribe', subscription);

        return subscription;
      } catch (error) {
        console.error("Failed to subscribe to push notifications:", error);
        return null;
      }
    }, [state.registration, state.permission]);

  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!state.registration) {
      return false;
    }

    try {
      const subscription =
        await state.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        // 서버에서 구독 정보 제거
        // await api.post('/notifications/unsubscribe', { endpoint: subscription.endpoint });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
      return false;
    }
  }, [state.registration]);

  return {
    ...state,
    requestPermission,
    showNotification,
    scheduleLocalNotification,
    subscribeToPush,
    unsubscribeFromPush,
  };
};
