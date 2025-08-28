const CACHE_NAME = "bible-daily-v1";
const urlsToCache = [
  "/",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/manifest.json",
];

// Service Worker 설치
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// 캐시에서 응답 반환
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 캐시에 있으면 캐시된 버전 반환
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

// 푸시 알림 수신
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "새로운 알림이 있습니다.",
    icon: "/vite.svg",
    badge: "/vite.svg",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "2",
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
  };

  event.waitUntil(self.registration.showNotification("Bible Daily", options));
});

// 알림 클릭 처리
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    // 앱 열기
    event.waitUntil(clients.openWindow("/"));
  } else if (event.action === "close") {
    // 알림만 닫기
    event.notification.close();
  } else {
    // 기본 동작: 앱 열기
    event.waitUntil(clients.openWindow("/"));
  }
});

// 백그라운드 동기화
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // 오프라인 상태에서 저장된 데이터 동기화
  return fetch("/api/sync")
    .then(() => {
      console.log("Background sync completed");
    })
    .catch((error) => {
      console.error("Background sync failed:", error);
    });
}
