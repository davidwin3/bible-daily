const CACHE_NAME = "bible-daily-v2";
const STATIC_CACHE = "bible-daily-static-v2";
const DYNAMIC_CACHE = "bible-daily-dynamic-v2";

// 정적 파일들 (런타임에 동적으로 추가됨)
const urlsToCache = ["/", "/manifest.json", "/vite.svg"];

// 개발 환경 감지
const isDev =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";

// Service Worker 설치
self.addEventListener("install", (event) => {
  console.log(
    `[SW] Service Worker 설치 중... (환경: ${isDev ? "개발" : "운영"})`
  );

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] 캐시 열기 성공:", STATIC_CACHE);
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// 활성화 이벤트 - 오래된 캐시 삭제
self.addEventListener("activate", (event) => {
  console.log("[SW] Service Worker 활성화 중...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log("[SW] 오래된 캐시 삭제:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  console.log("[SW] Service Worker 활성화 완료");
  self.clients.claim();
});

// 네트워크 요청 가로채기
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 개발 환경에서 디버깅 정보 출력
  if (isDev) {
    console.log(`[SW] Fetch 요청:`, url.pathname, request.method);
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    if (isDev) {
      console.log(`[SW] Cross-origin 요청 건너뜀:`, url.origin);
    }
    return;
  }

  // API 요청에 대한 특별한 처리
  if (url.pathname.startsWith("/api/")) {
    if (isDev) {
      console.log(`[SW] API 요청 처리:`, url.pathname);
    }
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // 정적 파일에 대한 캐시 우선 전략
  if (isDev) {
    console.log(`[SW] 정적 파일 요청 처리:`, url.pathname);
  }
  event.respondWith(handleStaticRequest(request));
});

// API 요청 처리 함수
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  // POST, PUT, DELETE, PATCH 요청은 항상 네트워크에서 가져오고 캐시하지 않음
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    try {
      const response = await fetch(request);
      return response;
    } catch (error) {
      // 네트워크 오류 시 오프라인 응답 반환
      return new Response(
        JSON.stringify({
          error: "네트워크 연결이 없습니다. 나중에 다시 시도해주세요.",
          offline: true,
        }),
        {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // GET 요청에 대한 네트워크 우선 전략 (단, 짧은 캐시 시간 적용)
  if (method === "GET") {
    try {
      // 네트워크에서 최신 데이터 가져오기 시도
      const response = await fetch(request);

      if (response && response.status === 200) {
        // 성공적인 응답만 캐시 (짧은 시간)
        const responseToCache = response.clone();
        const cache = await caches.open(DYNAMIC_CACHE);

        // 캐시에 타임스탬프 추가
        const cachedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: {
            ...Object.fromEntries(responseToCache.headers.entries()),
            "sw-cached-at": Date.now().toString(),
            "cache-control": "max-age=60", // 1분 캐시
          },
        });

        cache.put(request, cachedResponse);
        return response;
      }

      return response;
    } catch (error) {
      // 네트워크 오류 시 캐시된 데이터 확인
      const cachedResponse = await caches.match(request);

      if (cachedResponse) {
        // 캐시된 시간 확인
        const cachedAt = cachedResponse.headers.get("sw-cached-at");
        const cacheAge = cachedAt ? Date.now() - parseInt(cachedAt) : Infinity;
        const maxCacheAge = 5 * 60 * 1000; // 5분

        if (cacheAge < maxCacheAge) {
          // 캐시가 아직 유효함을 헤더에 표시
          const staleResponse = new Response(cachedResponse.body, {
            status: cachedResponse.status,
            statusText: cachedResponse.statusText,
            headers: {
              ...Object.fromEntries(cachedResponse.headers.entries()),
              "x-served-from": "cache",
              "x-cache-stale": "false",
            },
          });
          return staleResponse;
        }
      }

      // 캐시도 없거나 오래된 경우 오프라인 응답
      return new Response(
        JSON.stringify({
          error: "네트워크 연결이 없고 캐시된 데이터도 없습니다.",
          offline: true,
        }),
        {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // 기타 메서드는 네트워크에서만 처리
  return fetch(request);
}

// 정적 파일 요청 처리 함수
async function handleStaticRequest(request) {
  const url = new URL(request.url);

  // 정적 파일인지 확인
  const isStaticFile = url.pathname.match(
    /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ico|webp)$/
  );

  if (isStaticFile) {
    // 정적 파일은 캐시 우선 전략
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  // 네트워크에서 가져오기
  try {
    const response = await fetch(request);

    // 유효한 응답인지 확인
    if (!response || response.status !== 200 || response.type !== "basic") {
      return response;
    }

    // 응답 복사 (스트림은 한 번만 사용 가능)
    const responseToCache = response.clone();

    // 캐시할 파일 유형 결정
    const cacheName = isStaticFile ? STATIC_CACHE : DYNAMIC_CACHE;

    const cache = await caches.open(cacheName);
    cache.put(request, responseToCache);

    return response;
  } catch (error) {
    // 네트워크 오류 시 캐시에서 찾기
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // HTML 문서 요청이면 기본 페이지 반환
    if (request.destination === "document") {
      const fallbackResponse = await caches.match("/");
      return (
        fallbackResponse || new Response("오프라인입니다.", { status: 503 })
      );
    }

    throw error;
  }
}

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

  // 매일 성경 읽기 알림 특별 처리
  if (event.notification.tag === "daily-bible-reminder") {
    if (event.action === "remind-later") {
      // 1시간 후 다시 알림
      setTimeout(() => {
        self.registration.showNotification("📖 성경 읽기 리마인더", {
          body: "성경 읽기 시간입니다. 오늘의 말씀을 확인해보세요.",
          icon: "/vite.svg",
          badge: "/vite.svg",
          tag: "daily-bible-reminder-snooze",
          requireInteraction: true,
          actions: [
            {
              action: "read-now",
              title: "지금 읽기",
            },
          ],
        });
      }, 60 * 60 * 1000); // 1시간 후
      return;
    }
  }

  // 앱이 이미 열려있는지 확인하고 포커스
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        let targetUrl = "/";

        // 알림 타입에 따른 URL 결정
        if (
          event.notification.tag === "daily-bible-reminder" ||
          event.notification.tag === "daily-bible-reminder-snooze"
        ) {
          targetUrl = "/missions"; // 미션 페이지로 이동
        } else if (event.action === "explore") {
          targetUrl = "/";
        }

        // 이미 열린 탭이 있으면 포커스하고 해당 페이지로 이동
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            // 클라이언트에게 페이지 이동 메시지 전송
            client.postMessage({
              type: "NAVIGATE_TO",
              url: targetUrl,
              source: "notification-click",
            });
            return;
          }
        }

        // 열린 탭이 없으면 새로 열기
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
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
  const API_BASE = self.location.origin.includes("localhost")
    ? "http://localhost:3000"
    : "__VITE_API_BASE_URL__"; // 환경변수로 대체됨

  return fetch(`${API_BASE}/sync/background`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Background sync completed:", data);

      // 동기화 완료를 클라이언트에 알림
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SYNC_COMPLETED",
            data: data,
          });
        });
      });
    })
    .catch((error) => {
      console.error("Background sync failed:", error);

      // 실패를 클라이언트에 알림
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SYNC_FAILED",
            error: error.message,
          });
        });
      });
    });
}

// 메시지 리스너 (캐시 관리용)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case "CLEAR_CACHE":
        event.waitUntil(clearAllCaches());
        break;
      case "CLEAR_API_CACHE":
        event.waitUntil(clearAPICache());
        break;
      case "SKIP_WAITING":
        self.skipWaiting();
        break;
      case "GET_CACHE_INFO":
        event.waitUntil(
          getCacheInfo().then((info) => {
            event.ports[0]?.postMessage(info);
          })
        );
        break;
    }
  }
});

// 모든 캐시 삭제
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  const deletePromises = cacheNames.map((cacheName) =>
    caches.delete(cacheName)
  );
  await Promise.all(deletePromises);
  console.log("All caches cleared");
}

// API 캐시만 삭제
async function clearAPICache() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();
  const apiRequests = requests.filter((request) =>
    new URL(request.url).pathname.startsWith("/api/")
  );
  const deletePromises = apiRequests.map((request) => cache.delete(request));
  await Promise.all(deletePromises);
  console.log("API cache cleared");
}

// 캐시 정보 반환
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = {};

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    info[cacheName] = {
      count: keys.length,
      urls: keys.map((key) => key.url).slice(0, 10), // 최대 10개만
    };
  }

  return info;
}
