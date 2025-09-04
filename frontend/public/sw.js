const CACHE_NAME = "bible-daily-v2";
const STATIC_CACHE = "bible-daily-static-v2";
const DYNAMIC_CACHE = "bible-daily-dynamic-v2";

// 정적 파일들 (런타임에 동적으로 추가됨)
const urlsToCache = ["/", "/manifest.json", "/vite.svg"];

// Service Worker 설치
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// 활성화 이벤트 - 오래된 캐시 삭제
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 네트워크 요청 가로채기
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      // 캐시에 있으면 캐시된 버전 반환
      if (response) {
        return response;
      }

      // 네트워크에서 가져오기
      return fetch(request)
        .then((response) => {
          // 유효한 응답인지 확인
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // 응답 복사 (스트림은 한 번만 사용 가능)
          const responseToCache = response.clone();

          // 캐시할 파일 유형 결정
          const cacheName = url.pathname.match(
            /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/
          )
            ? STATIC_CACHE
            : DYNAMIC_CACHE;

          caches.open(cacheName).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // 네트워크 오류 시 기본 오프라인 페이지 반환
          if (request.destination === "document") {
            return caches.match("/");
          }
        });
    })
  );
});

// 푸시 알림 수신
self.addEventListener("push", (event) => {
  let notificationData = {
    title: "Bible Daily",
    body: "새로운 알림이 있습니다.",
    icon: "/vite.svg",
    badge: "/vite.svg",
    tag: "bible-daily-notification",
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "bible-daily",
    },
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData,
        title: pushData.title || notificationData.title,
        body: pushData.body || notificationData.body,
      };
    } catch (error) {
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    vibrate: [100, 50, 100],
    data: notificationData.data,
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

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// 알림 클릭 처리
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    // 알림만 닫기
    return;
  }

  // 앱이 이미 열려있는지 확인하고 포커스
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const url = event.action === "explore" ? "/" : "/";

        // 이미 열린 탭이 있으면 포커스
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }

        // 열린 탭이 없으면 새로 열기
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
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
