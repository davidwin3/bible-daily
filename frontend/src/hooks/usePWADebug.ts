import { useState, useEffect } from "react";

interface PWADebugInfo {
  // Service Worker 정보
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
  serviceWorkerState: string;
  isServiceWorkerSupported: boolean;

  // 푸시 알림 정보
  notificationPermission: NotificationPermission;
  isNotificationSupported: boolean;
  pushSubscription: PushSubscription | null;

  // 설치 정보
  isInstallable: boolean;
  isInstalled: boolean;
  installPromptEvent: any;

  // 캐시 정보
  cacheNames: string[];
  cacheSize: number;

  // 네트워크 정보
  isOnline: boolean;
  connectionType: string;

  // 기타
  isStandalone: boolean;
  userAgent: string;
}

export function usePWADebug() {
  const [debugInfo, setDebugInfo] = useState<PWADebugInfo>({
    serviceWorkerRegistration: null,
    serviceWorkerState: "not-supported",
    isServiceWorkerSupported: "serviceWorker" in navigator,
    notificationPermission: "default",
    isNotificationSupported: "Notification" in window,
    pushSubscription: null,
    isInstallable: false,
    isInstalled: false,
    installPromptEvent: null,
    cacheNames: [],
    cacheSize: 0,
    isOnline: navigator.onLine,
    connectionType: (navigator as any).connection?.effectiveType || "unknown",
    isStandalone: window.matchMedia("(display-mode: standalone)").matches,
    userAgent: navigator.userAgent,
  });

  const [isDebugVisible, setIsDebugVisible] = useState(() => {
    const saved = localStorage.getItem("pwa-debug-visible");
    return saved ? JSON.parse(saved) : process.env.NODE_ENV === "development";
  });

  // Service Worker 정보 업데이트
  const updateServiceWorkerInfo = async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        setDebugInfo((prev) => ({
          ...prev,
          serviceWorkerRegistration: registration,
          serviceWorkerState: registration.active?.state || "installing",
        }));
      }
    } catch (error) {
      console.error("Service Worker 정보 조회 실패:", error);
    }
  };

  // 푸시 구독 정보 업데이트
  const updatePushSubscription = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setDebugInfo((prev) => ({
        ...prev,
        pushSubscription: subscription,
      }));
    } catch (error) {
      console.error("푸시 구독 정보 조회 실패:", error);
    }
  };

  // 캐시 정보 업데이트
  const updateCacheInfo = async () => {
    if (!("caches" in window)) return;

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        totalSize += keys.length;
      }

      setDebugInfo((prev) => ({
        ...prev,
        cacheNames,
        cacheSize: totalSize,
      }));
    } catch (error) {
      console.error("캐시 정보 조회 실패:", error);
    }
  };

  // 디버그 정보 새로고침
  const refreshDebugInfo = async () => {
    await Promise.all([
      updateServiceWorkerInfo(),
      updatePushSubscription(),
      updateCacheInfo(),
    ]);

    setDebugInfo((prev) => ({
      ...prev,
      notificationPermission:
        "Notification" in window ? Notification.permission : "default",
      isOnline: navigator.onLine,
      connectionType: (navigator as any).connection?.effectiveType || "unknown",
      isStandalone: window.matchMedia("(display-mode: standalone)").matches,
    }));
  };

  // PWA 설치 프롬프트 처리
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDebugInfo((prev) => ({
        ...prev,
        installPromptEvent: e,
        isInstallable: true,
      }));
    };

    const handleAppInstalled = () => {
      setDebugInfo((prev) => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPromptEvent: null,
      }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // 네트워크 상태 모니터링
  useEffect(() => {
    const handleOnline = () =>
      setDebugInfo((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () =>
      setDebugInfo((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 초기 정보 로드
  useEffect(() => {
    refreshDebugInfo();
  }, []);

  // 디버그 패널 토글
  const toggleDebugPanel = () => {
    const newVisible = !isDebugVisible;
    setIsDebugVisible(newVisible);
    localStorage.setItem("pwa-debug-visible", JSON.stringify(newVisible));
  };

  // 캐시 클리어
  const clearCaches = async () => {
    if (!("caches" in window)) return false;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      await updateCacheInfo();
      return true;
    } catch (error) {
      console.error("캐시 클리어 실패:", error);
      return false;
    }
  };

  // Service Worker 업데이트
  const updateServiceWorker = async () => {
    if (!debugInfo.serviceWorkerRegistration) return false;

    try {
      await debugInfo.serviceWorkerRegistration.update();
      await updateServiceWorkerInfo();
      return true;
    } catch (error) {
      console.error("Service Worker 업데이트 실패:", error);
      return false;
    }
  };

  // PWA 설치 트리거
  const installPWA = async () => {
    if (!debugInfo.installPromptEvent) return false;

    try {
      debugInfo.installPromptEvent.prompt();
      const { outcome } = await debugInfo.installPromptEvent.userChoice;

      if (outcome === "accepted") {
        setDebugInfo((prev) => ({
          ...prev,
          installPromptEvent: null,
          isInstallable: false,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error("PWA 설치 실패:", error);
      return false;
    }
  };

  // 테스트 알림 전송
  const sendTestNotification = () => {
    if (!("Notification" in window)) return false;

    if (Notification.permission === "granted") {
      new Notification("PWA 디버그 테스트", {
        body: "푸시 알림이 정상 작동합니다!",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
        tag: "debug-test",
      });
      return true;
    }
    return false;
  };

  return {
    debugInfo,
    isDebugVisible,
    toggleDebugPanel,
    refreshDebugInfo,
    clearCaches,
    updateServiceWorker,
    installPWA,
    sendTestNotification,
  };
}
