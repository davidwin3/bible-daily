const CACHE_NAME = "bible-daily-v2";
const STATIC_CACHE = "bible-daily-static-v2";
const DYNAMIC_CACHE = "bible-daily-dynamic-v2";

// 알림 관련 상수 import
const NOTIFICATION_ICONS = {
  DEFAULT: "/icons/192.png",
  BADGE: "/icons/192.png",
};

const NOTIFICATION_TYPES = {
  DAILY_REMINDER: "daily-reminder",
  MISSION_DEADLINE: "mission-deadline",
  MISSION_REMINDER: "mission-reminder",
  ADMIN_TEST: "admin-test",
  CUSTOM: "custom",
};

const NOTIFICATION_TOPICS = {
  NEW_MISSIONS: "new-missions",
  MISSION_REMINDERS: "mission-reminders",
  COMMUNITY_UPDATES: "community-updates",
  ANNOUNCEMENTS: "announcements",
};

const NOTIFICATION_TAGS = {
  DAILY_BIBLE_REMINDER: "daily-bible-reminder",
  DAILY_BIBLE_REMINDER_SNOOZE: "daily-bible-reminder-snooze",
  MISSION_REMINDER_LATER: "mission-reminder-later",
  ADMIN_TEST: "admin-test-notification",
  SCHEDULED: "scheduled-notification",
  DEFAULT: "bible-daily-notification",
};

const NOTIFICATION_ACTIONS = {
  OPEN: "open",
  CLOSE: "close",
  EXPLORE: "explore",
  VIEW_MISSIONS: "view-missions",
  VIEW_COMMUNITY: "view-community",
  VIEW_ANNOUNCEMENT: "view-announcement",
  COMPLETE_MISSION: "complete-mission",
  REMIND_LATER: "remind-later",
};

const NOTIFICATION_ACTION_LABELS = {
  OPEN: "열기",
  CLOSE: "닫기",
  EXPLORE: "확인하기",
  VIEW_MISSIONS: "미션 보기",
  VIEW_COMMUNITY: "커뮤니티 보기",
  VIEW_ANNOUNCEMENT: "공지사항 보기",
  COMPLETE_MISSION: "미션 완료하기",
  REMIND_LATER: "1시간 후 알림",
};

const NOTIFICATION_MESSAGES = {
  DAILY_REMINDER: {
    TITLE: "📖 성경 읽기 시간입니다!",
    BODY: "오늘의 성경 말씀을 읽어보세요. 하나님의 말씀으로 하루를 시작하세요.",
  },
  MISSION_REMINDER_LATER: {
    TITLE: "⏰ 미션 다시 알림",
    BODY: "미션을 완료할 시간입니다!",
  },
  BIBLE_READING_SNOOZE: {
    TITLE: "📖 성경 읽기 리마인더",
    BODY: "성경 읽기 시간입니다. 오늘의 말씀을 확인해보세요.",
  },
  DEFAULT: {
    TITLE: "Bible Daily",
    BODY: "새로운 알림이 있습니다.",
  },
};

const SYNC_TAGS = {
  BACKGROUND_CHECK: "background-notification-check",
  DAILY_CHECK: "daily-notification-check",
};

const TIMING = {
  REMIND_LATER_DELAY: 60 * 60 * 1000, // 1시간 후
};

const ROUTES = {
  HOME: "/",
  MISSIONS: "/missions",
  POSTS: "/posts",
  MANIFEST: "/manifest.json",
};

const VIBRATION_PATTERNS = {
  DEFAULT: [100, 50, 100],
};

const MESSAGE_TYPES = {
  SCHEDULE_NOTIFICATION: "SCHEDULE_NOTIFICATION",
  CANCEL_NOTIFICATIONS: "CANCEL_NOTIFICATIONS",
  TRIGGER_BACKGROUND_CHECK: "TRIGGER_BACKGROUND_CHECK",
  NAVIGATE: "navigate",
};

const LOG_MESSAGES = {
  BACKGROUND_CHECK_START: "🔄 백그라운드 알림 체크 시작",
  PERIODIC_CHECK_START: "🔄 주기적 알림 체크 시작",
  BACKGROUND_NOTIFICATION_SENT: "📱 백그라운드 알림 발송:",
  NOTIFICATION_CLOSED: "알림이 닫혔습니다.",
  REMIND_LATER_SET: "1시간 후 다시 알림이 설정되었습니다.",
  NOTIFICATIONS_CANCELLED: "${type} 타입의 알림들이 취소되었습니다.",
  NOTIFICATION_POSTPONED: "⏰ 알림이 방해 금지 시간 이후로 연기되었습니다:",
};

const ERROR_MESSAGES = {
  BACKGROUND_CHECK_ERROR: "❌ 백그라운드 알림 체크 오류:",
  NOTIFICATION_CANCEL_ERROR: "알림 취소 오류:",
};

const TOPIC_CONFIGS = {
  [NOTIFICATION_TOPICS.NEW_MISSIONS]: {
    routing: { url: ROUTES.MISSIONS, requiresAuth: false },
    icon: NOTIFICATION_ICONS.DEFAULT,
    badge: NOTIFICATION_ICONS.BADGE,
    tag: NOTIFICATION_TOPICS.NEW_MISSIONS,
    actions: [
      {
        action: NOTIFICATION_ACTIONS.VIEW_MISSIONS,
        title: NOTIFICATION_ACTION_LABELS.VIEW_MISSIONS,
        icon: NOTIFICATION_ICONS.DEFAULT,
      },
      {
        action: NOTIFICATION_ACTIONS.CLOSE,
        title: NOTIFICATION_ACTION_LABELS.CLOSE,
        icon: NOTIFICATION_ICONS.DEFAULT,
      },
    ],
    requireInteraction: true,
  },
  [NOTIFICATION_TOPICS.MISSION_REMINDERS]: {
    routing: { url: ROUTES.MISSIONS, requiresAuth: false },
    icon: NOTIFICATION_ICONS.DEFAULT,
    badge: NOTIFICATION_ICONS.BADGE,
    tag: NOTIFICATION_TOPICS.MISSION_REMINDERS,
    actions: [
      {
        action: NOTIFICATION_ACTIONS.COMPLETE_MISSION,
        title: NOTIFICATION_ACTION_LABELS.COMPLETE_MISSION,
        icon: NOTIFICATION_ICONS.DEFAULT,
      },
      {
        action: NOTIFICATION_ACTIONS.REMIND_LATER,
        title: NOTIFICATION_ACTION_LABELS.REMIND_LATER,
        icon: NOTIFICATION_ICONS.DEFAULT,
      },
      {
        action: NOTIFICATION_ACTIONS.CLOSE,
        title: NOTIFICATION_ACTION_LABELS.CLOSE,
        icon: NOTIFICATION_ICONS.DEFAULT,
      },
    ],
    requireInteraction: false,
  },
  [NOTIFICATION_TOPICS.COMMUNITY_UPDATES]: {
    routing: { url: ROUTES.POSTS, requiresAuth: false },
    icon: NOTIFICATION_ICONS.DEFAULT,
    badge: NOTIFICATION_ICONS.BADGE,
    tag: NOTIFICATION_TOPICS.COMMUNITY_UPDATES,
    actions: [
      {
        action: NOTIFICATION_ACTIONS.VIEW_COMMUNITY,
        title: NOTIFICATION_ACTION_LABELS.VIEW_COMMUNITY,
        icon: NOTIFICATION_ICONS.DEFAULT,
      },
      {
        action: NOTIFICATION_ACTIONS.CLOSE,
        title: NOTIFICATION_ACTION_LABELS.CLOSE,
        icon: NOTIFICATION_ICONS.DEFAULT,
      },
    ],
    requireInteraction: false,
  },
  [NOTIFICATION_TOPICS.ANNOUNCEMENTS]: {
    routing: { url: ROUTES.HOME, requiresAuth: false },
    icon: NOTIFICATION_ICONS.DEFAULT,
    badge: NOTIFICATION_ICONS.BADGE,
    tag: NOTIFICATION_TOPICS.ANNOUNCEMENTS,
    actions: [
      {
        action: NOTIFICATION_ACTIONS.VIEW_ANNOUNCEMENT,
        title: NOTIFICATION_ACTION_LABELS.VIEW_ANNOUNCEMENT,
        icon: NOTIFICATION_ICONS.DEFAULT,
      },
      {
        action: NOTIFICATION_ACTIONS.CLOSE,
        title: NOTIFICATION_ACTION_LABELS.CLOSE,
        icon: NOTIFICATION_ICONS.DEFAULT,
      },
    ],
    requireInteraction: true,
  },
};

// 유틸리티 함수들
function isValidNotificationTopic(topic) {
  return Object.values(NOTIFICATION_TOPICS).includes(topic);
}

function createAdminTestNotificationOptions(
  notificationBody,
  notificationData
) {
  return {
    body: notificationBody,
    icon: NOTIFICATION_ICONS.DEFAULT,
    badge: NOTIFICATION_ICONS.BADGE,
    tag: NOTIFICATION_TAGS.ADMIN_TEST,
    data: {
      ...notificationData,
      dateOfArrival: Date.now(),
      primaryKey: "bible-daily",
    },
    actions: [
      {
        action: NOTIFICATION_ACTIONS.EXPLORE,
        title: NOTIFICATION_ACTION_LABELS.EXPLORE,
        icon: NOTIFICATION_ICONS.DEFAULT,
      },
      {
        action: NOTIFICATION_ACTIONS.CLOSE,
        title: NOTIFICATION_ACTION_LABELS.CLOSE,
        icon: NOTIFICATION_ICONS.DEFAULT,
      },
    ],
    requireInteraction: true,
    silent: false,
  };
}

function createTopicNotificationOptions(topic, title, body, data = {}) {
  const config = TOPIC_CONFIGS[topic];
  if (!config) {
    return createDefaultNotificationOptions(title, body, data);
  }

  return {
    body,
    icon: config.icon,
    badge: config.badge,
    tag: config.tag,
    vibrate: [100, 50, 100],
    data: {
      ...data,
      topic,
      dateOfArrival: Date.now(),
      primaryKey: "bible-daily",
    },
    actions: config.actions,
    requireInteraction: config.requireInteraction,
    silent: false,
  };
}

function createDefaultNotificationOptions(title, body, data = {}) {
  return {
    body,
    icon: "/icons/192.png",
    badge: "/icons/192.png",
    tag: "bible-daily-notification",
    vibrate: [100, 50, 100],
    data: {
      ...data,
      dateOfArrival: Date.now(),
      primaryKey: "bible-daily",
    },
    actions: [
      {
        action: NOTIFICATION_ACTIONS.EXPLORE,
        title: NOTIFICATION_ACTION_LABELS.EXPLORE,
        icon: NOTIFICATION_ICONS.DEFAULT,
      },
      {
        action: NOTIFICATION_ACTIONS.CLOSE,
        title: NOTIFICATION_ACTION_LABELS.CLOSE,
        icon: NOTIFICATION_ICONS.DEFAULT,
      },
    ],
    requireInteraction: false,
    silent: false,
  };
}

function getTopicRoutingUrl(topic, action, data = {}) {
  const config = TOPIC_CONFIGS[topic];
  if (!config) return "/";

  // 액션별 특별한 라우팅
  switch (action) {
    case "view-missions":
    case "complete-mission":
      return "/missions";
    case "view-community":
      return "/posts";
    case "view-announcement":
      return "/";
    default:
      return config.routing.url;
  }
}

function handleNotificationAction(action, topic, data = {}) {
  // 공통 액션 처리
  if (action === "close") {
    return "";
  }

  // 토픽별 액션 처리
  if (topic) {
    if (
      action === "remind-later" &&
      topic === NOTIFICATION_TOPICS.MISSION_REMINDERS
    ) {
      return "remind-later";
    }

    return getTopicRoutingUrl(topic, action, data);
  }

  return "/";
}

// 정적 파일들 (런타임에 동적으로 추가됨)
const urlsToCache = [ROUTES.HOME, ROUTES.MANIFEST, NOTIFICATION_ICONS.DEFAULT];

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

// 백그라운드 동기화를 위한 주기적 체크
self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAGS.BACKGROUND_CHECK) {
    console.log(LOG_MESSAGES.BACKGROUND_CHECK_START);
    event.waitUntil(checkScheduledNotifications());
  }
});

// 주기적인 백그라운드 작업 (PWA가 설치된 경우)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === SYNC_TAGS.DAILY_CHECK) {
    console.log(LOG_MESSAGES.PERIODIC_CHECK_START);
    event.waitUntil(checkScheduledNotifications());
  }
});

// 스케줄된 알림 확인 및 발송
async function checkScheduledNotifications() {
  try {
    // IndexedDB에서 스케줄된 알림 목록 가져오기
    const scheduledNotifications = await getScheduledNotifications();
    const now = new Date();

    for (const notification of scheduledNotifications) {
      const scheduleTime = new Date(notification.scheduleTime);

      // 알림 시간이 지났고 아직 발송되지 않았다면
      if (scheduleTime <= now && !notification.sent) {
        // 방해 금지 시간 체크
        if (!isInQuietHours(notification.settings)) {
          await showScheduledNotification(notification);
          await markNotificationAsSent(notification.id);

          // 일일 알림인 경우 다음 날 스케줄 생성
          if (notification.type === NOTIFICATION_TYPES.DAILY_REMINDER) {
            await scheduleNextDayNotification(notification);
          }
        } else {
          // 방해 금지 시간이면 다음 체크 시간으로 연기
          await postponeNotification(notification);
        }
      }
    }
  } catch (error) {
    console.error(ERROR_MESSAGES.BACKGROUND_CHECK_ERROR, error);
  }
}

// IndexedDB에서 스케줄된 알림 가져오기
async function getScheduledNotifications() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("BibleDailyNotifications", 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["notifications"], "readonly");
      const store = transaction.objectStore("notifications");
      const getRequest = store.getAll();

      getRequest.onsuccess = () => resolve(getRequest.result || []);
      getRequest.onerror = () => reject(getRequest.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("notifications")) {
        const store = db.createObjectStore("notifications", { keyPath: "id" });
        store.createIndex("scheduleTime", "scheduleTime", { unique: false });
        store.createIndex("type", "type", { unique: false });
      }
    };
  });
}

// 알림을 발송됨으로 표시
async function markNotificationAsSent(notificationId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("BibleDailyNotifications", 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["notifications"], "readwrite");
      const store = transaction.objectStore("notifications");

      const getRequest = store.get(notificationId);
      getRequest.onsuccess = () => {
        const notification = getRequest.result;
        if (notification) {
          notification.sent = true;
          notification.sentAt = new Date().toISOString();
          const putRequest = store.put(notification);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        }
      };
    };
  });
}

// 다음 날 일일 알림 스케줄 생성
async function scheduleNextDayNotification(notification) {
  const nextDay = new Date(notification.scheduleTime);
  nextDay.setDate(nextDay.getDate() + 1);

  const newNotification = {
    ...notification,
    id: `daily-reminder-${Date.now()}`,
    scheduleTime: nextDay.toISOString(),
    sent: false,
    createdAt: new Date().toISOString(),
  };

  await saveNotificationToIndexedDB(newNotification);
}

// 알림을 방해 금지 시간 이후로 연기
async function postponeNotification(notification) {
  const settings = notification.settings;
  if (!settings?.quietHours) return;

  const now = new Date();
  const [endHour, endMin] = settings.quietEnd.split(":").map(Number);

  const postponedTime = new Date(now);
  postponedTime.setHours(endHour, endMin, 0, 0);

  // 방해 금지 종료 시간이 이미 지났다면 내일로 설정
  if (postponedTime <= now) {
    postponedTime.setDate(postponedTime.getDate() + 1);
  }

  // 알림 시간 업데이트
  notification.scheduleTime = postponedTime.toISOString();
  await saveNotificationToIndexedDB(notification);

  console.log(
    `${LOG_MESSAGES.NOTIFICATION_POSTPONED} ${postponedTime.toLocaleString()}`
  );
}

// 방해 금지 시간 체크
function isInQuietHours(settings) {
  if (!settings?.quietHours) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = settings.quietStart.split(":").map(Number);
  const [endHour, endMin] = settings.quietEnd.split(":").map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    return currentTime >= startTime && currentTime <= endTime;
  }
}

// 스케줄된 알림 표시
async function showScheduledNotification(notification) {
  const options = {
    body: notification.body,
    icon: NOTIFICATION_ICONS.DEFAULT,
    badge: NOTIFICATION_ICONS.BADGE,
    tag: notification.tag || NOTIFICATION_TAGS.SCHEDULED,
    requireInteraction: notification.requireInteraction || true,
    vibrate: VIBRATION_PATTERNS.DEFAULT,
    data: {
      ...notification.data,
      type: notification.type,
      scheduleTime: notification.scheduleTime,
      source: "background",
    },
    actions: [
      {
        action: NOTIFICATION_ACTIONS.OPEN,
        title: NOTIFICATION_ACTION_LABELS.OPEN,
        icon: NOTIFICATION_ICONS.DEFAULT,
      },
      {
        action: NOTIFICATION_ACTIONS.CLOSE,
        title: NOTIFICATION_ACTION_LABELS.CLOSE,
        icon: NOTIFICATION_ICONS.DEFAULT,
      },
    ],
  };

  await self.registration.showNotification(notification.title, options);
  console.log(LOG_MESSAGES.BACKGROUND_NOTIFICATION_SENT, notification.title);
}

// IndexedDB에 알림 저장
async function saveNotificationToIndexedDB(notification) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("BibleDailyNotifications", 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["notifications"], "readwrite");
      const store = transaction.objectStore("notifications");
      const putRequest = store.put(notification);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
  });
}

// 푸시 알림 수신
self.addEventListener("push", (event) => {
  let pushData = null;
  let notificationTitle = "Bible Daily";
  let notificationBody = "새로운 알림이 있습니다.";

  if (event.data) {
    try {
      pushData = event.data.json();
      notificationTitle =
        pushData.notification?.title || pushData.title || notificationTitle;
      notificationBody =
        pushData.notification?.body || pushData.body || notificationBody;
    } catch (error) {
      notificationBody = event.data.text() || notificationBody;
    }
  }

  const notificationData = pushData?.data || {};
  const topic = notificationData.topic;
  const notificationType = notificationData.type;

  let options;

  // 관리자 테스트 알림 처리
  if (notificationType === "admin-test") {
    options = createAdminTestNotificationOptions(
      notificationBody,
      notificationData
    );
  }
  // 토픽별 알림 처리
  else if (topic && isValidNotificationTopic(topic)) {
    options = createTopicNotificationOptions(
      topic,
      notificationTitle,
      notificationBody,
      notificationData
    );
  } else {
    // 기본 알림 처리
    options = createDefaultNotificationOptions(
      notificationTitle,
      notificationBody,
      notificationData
    );
  }

  event.waitUntil(
    self.registration.showNotification(notificationTitle, options)
  );
});

// 알림 클릭 처리
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  // 액션별 처리
  if (action === NOTIFICATION_ACTIONS.OPEN || !action) {
    // 기본 클릭 또는 열기 액션
    let targetUrl = ROUTES.HOME;

    if (data.type === NOTIFICATION_TYPES.DAILY_REMINDER) {
      targetUrl = ROUTES.HOME;
    } else if (data.url) {
      targetUrl = data.url;
    }

    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // 이미 열린 탭이 있으면 해당 탭을 활성화
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            if (targetUrl !== ROUTES.HOME) {
              client.postMessage({
                type: MESSAGE_TYPES.NAVIGATE,
                url: targetUrl,
              });
            }
            return;
          }
        }

        // 열린 탭이 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(self.location.origin + targetUrl);
        }
      })
    );
  } else if (action === NOTIFICATION_ACTIONS.CLOSE) {
    // 닫기 액션 - 별도 처리 없음
    console.log(LOG_MESSAGES.NOTIFICATION_CLOSED);
  } else if (action === NOTIFICATION_ACTIONS.REMIND_LATER) {
    // 1시간 후 다시 알림
    const laterTime = new Date(Date.now() + TIMING.REMIND_LATER_DELAY);
    const laterNotification = {
      id: `remind-later-${Date.now()}`,
      type: NOTIFICATION_TYPES.MISSION_REMINDER,
      title: NOTIFICATION_MESSAGES.MISSION_REMINDER_LATER.TITLE,
      body: NOTIFICATION_MESSAGES.MISSION_REMINDER_LATER.BODY,
      scheduleTime: laterTime.toISOString(),
      tag: NOTIFICATION_TAGS.MISSION_REMINDER_LATER,
      requireInteraction: false,
      sent: false,
      createdAt: new Date().toISOString(),
      data: data,
    };

    event.waitUntil(saveNotificationToIndexedDB(laterNotification));
    console.log(LOG_MESSAGES.REMIND_LATER_SET);
  }
});

// 메시지 수신 처리 (앱에서 서비스워커로 보내는 메시지)
self.addEventListener("message", (event) => {
  const { type, data } = event.data || {};

  if (type === MESSAGE_TYPES.SCHEDULE_NOTIFICATION) {
    // 앱에서 알림 스케줄 요청
    event.waitUntil(saveNotificationToIndexedDB(data));
  } else if (type === MESSAGE_TYPES.CANCEL_NOTIFICATIONS) {
    // 특정 타입 알림 취소
    event.waitUntil(cancelNotificationsByType(data.notificationType));
  } else if (type === MESSAGE_TYPES.TRIGGER_BACKGROUND_CHECK) {
    // 수동으로 백그라운드 체크 트리거
    event.waitUntil(checkScheduledNotifications());
  }
});

// 특정 타입의 알림 취소
async function cancelNotificationsByType(type) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(["notifications"], "readwrite");
    const store = transaction.objectStore("notifications");
    const index = store.index("type");

    const request = index.getAllKeys(type);
    request.onsuccess = () => {
      const keys = request.result;
      keys.forEach((key) => store.delete(key));
    };

    console.log(LOG_MESSAGES.NOTIFICATIONS_CANCELLED.replace("${type}", type));
  } catch (error) {
    console.error(ERROR_MESSAGES.NOTIFICATION_CANCEL_ERROR, error);
  }
}

// 데이터베이스 열기 헬퍼
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("BibleDailyNotifications", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// 기존 알림 클릭 처리 (토픽 기반)
self.addEventListener("notificationclick", (event) => {
  const notificationData = event.notification.data || {};
  const topic = notificationData.topic;
  const notificationType = notificationData.type;
  const action = event.action;

  // 관리자 테스트 알림 처리
  if (notificationType === NOTIFICATION_TYPES.ADMIN_TEST) {
    if (action === NOTIFICATION_ACTIONS.CLOSE) {
      return;
    }
    // 기본적으로 홈페이지로 이동
    navigateToUrl("/");
    return;
  }

  // 토픽별 액션 처리
  if (topic && isValidNotificationTopic(topic)) {
    const actionResult = handleNotificationAction(
      action,
      topic,
      notificationData
    );

    // remind-later 특별 처리
    if (actionResult === "remind-later") {
      setTimeout(() => {
        const reminderOptions = createTopicNotificationOptions(
          topic,
          "📖 미션 리마인더",
          "성경 읽기 시간입니다. 오늘의 말씀을 확인해보세요.",
          {
            ...notificationData,
            isReminder: "true",
          }
        );

        self.registration.showNotification("📖 미션 리마인더", reminderOptions);
      }, 60 * 60 * 1000); // 1시간 후
      return;
    }

    // close 액션이면 아무것도 하지 않음
    if (actionResult === "") {
      return;
    }

    // URL 네비게이션
    navigateToUrl(actionResult);
    return;
  }

  // 레거시 처리 (기존 daily-bible-reminder)
  if (event.notification.tag === "daily-bible-reminder") {
    if (event.action === "remind-later") {
      setTimeout(() => {
        self.registration.showNotification(
          NOTIFICATION_MESSAGES.BIBLE_READING_SNOOZE.TITLE,
          {
            body: NOTIFICATION_MESSAGES.BIBLE_READING_SNOOZE.BODY,
            icon: NOTIFICATION_ICONS.DEFAULT,
            badge: NOTIFICATION_ICONS.BADGE,
            tag: NOTIFICATION_TAGS.DAILY_BIBLE_REMINDER_SNOOZE,
            requireInteraction: true,
            actions: [
              {
                action: "read-now",
                title: "지금 읽기",
              },
            ],
          }
        );
      }, 60 * 60 * 1000);
      return;
    }
    navigateToUrl("/missions");
    return;
  }

  // 기본 처리
  if (action === "close") {
    return;
  }

  navigateToUrl("/");
});

// URL 네비게이션 헬퍼 함수
function navigateToUrl(targetUrl) {
  // 앱이 이미 열려있는지 확인하고 포커스
  clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clientList) => {
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
    });
}

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
    : process.env.VITE_API_BASE_URL; // 환경변수로 대체됨

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
