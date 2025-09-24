/**
 * 백그라운드 알림 스케줄링을 위한 IndexedDB 유틸리티
 */

import {
  NOTIFICATION_TYPES,
  NOTIFICATION_MESSAGES,
  NOTIFICATION_TAGS,
  DB_CONFIG,
  TIMING,
  SYNC_TAGS,
  PERMISSIONS,
  ROUTES,
  LOG_MESSAGES,
  ERROR_MESSAGES,
} from "@/constants";

export interface ScheduledNotification {
  id: string;
  type: (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
  title: string;
  body: string;
  scheduleTime: string; // ISO string
  tag?: string;
  requireInteraction?: boolean;
  sent: boolean;
  sentAt?: string;
  createdAt: string;
  data?: Record<string, any>;
  settings?: {
    quietHours: boolean;
    quietStart: string;
    quietEnd: string;
  };
}

const { NAME: DB_NAME, VERSION: DB_VERSION, STORE_NAME } = DB_CONFIG;

/**
 * IndexedDB 연결 및 초기화
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex(
          DB_CONFIG.INDEXES.SCHEDULE_TIME,
          DB_CONFIG.INDEXES.SCHEDULE_TIME,
          { unique: false }
        );
        store.createIndex(DB_CONFIG.INDEXES.TYPE, DB_CONFIG.INDEXES.TYPE, {
          unique: false,
        });
        store.createIndex(DB_CONFIG.INDEXES.SENT, DB_CONFIG.INDEXES.SENT, {
          unique: false,
        });
      }
    };
  });
}

/**
 * 알림 스케줄 저장
 */
export async function saveScheduledNotification(
  notification: ScheduledNotification
): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.put(notification);
    request.onsuccess = () => {
      console.log(LOG_MESSAGES.NOTIFICATION_SAVED, notification.id);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * 모든 스케줄된 알림 가져오기
 */
export async function getScheduledNotifications(): Promise<
  ScheduledNotification[]
> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 특정 타입의 알림만 가져오기
 */
export async function getNotificationsByType(
  type: string
): Promise<ScheduledNotification[]> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index(DB_CONFIG.INDEXES.TYPE);

  return new Promise((resolve, reject) => {
    const request = index.getAll(type);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 발송되지 않은 알림만 가져오기
 */
export async function getPendingNotifications(): Promise<
  ScheduledNotification[]
> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index(DB_CONFIG.INDEXES.SENT);

  return new Promise((resolve, reject) => {
    const request = index.getAll(IDBKeyRange.only(false));
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 알림 삭제
 */
export async function deleteScheduledNotification(id: string): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => {
      console.log(LOG_MESSAGES.NOTIFICATION_DELETED, id);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * 특정 타입의 모든 알림 삭제
 */
export async function deleteNotificationsByType(type: string): Promise<void> {
  const notifications = await getNotificationsByType(type);
  const promises = notifications.map((notification) =>
    deleteScheduledNotification(notification.id)
  );
  await Promise.all(promises);
}

/**
 * 오래된 발송된 알림들 정리 (7일 이상)
 */
export async function cleanupOldNotifications(): Promise<void> {
  const notifications = await getScheduledNotifications();
  const cleanupThreshold = new Date();
  cleanupThreshold.setTime(cleanupThreshold.getTime() - TIMING.CACHE_MAX_AGE);

  const oldNotifications = notifications.filter(
    (notification) =>
      notification.sent &&
      notification.sentAt &&
      new Date(notification.sentAt) < cleanupThreshold
  );

  const promises = oldNotifications.map((notification) =>
    deleteScheduledNotification(notification.id)
  );

  await Promise.all(promises);
  console.log(
    LOG_MESSAGES.OLD_NOTIFICATIONS_CLEANED.replace(
      "${count}",
      oldNotifications.length.toString()
    )
  );
}

/**
 * 백그라운드 동기화 요청 (서비스 워커가 활성화된 경우)
 */
export async function requestBackgroundSync(): Promise<void> {
  if (
    "serviceWorker" in navigator &&
    "sync" in window.ServiceWorkerRegistration.prototype
  ) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(SYNC_TAGS.BACKGROUND_CHECK);
      console.log(LOG_MESSAGES.BACKGROUND_SYNC_REQUESTED);
    } catch (error) {
      console.error(ERROR_MESSAGES.BACKGROUND_SYNC_FAILED, error);
    }
  }
}

/**
 * 주기적 백그라운드 동기화 등록 (PWA 환경에서만 가능)
 */
export async function registerPeriodicBackgroundSync(): Promise<void> {
  if (
    "serviceWorker" in navigator &&
    "periodicSync" in window.ServiceWorkerRegistration.prototype
  ) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const status = await navigator.permissions.query({
        name: PERMISSIONS.PERIODIC_BACKGROUND_SYNC as any,
      });

      if (status.state === "granted") {
        await (registration as any).periodicSync.register(
          SYNC_TAGS.DAILY_CHECK,
          {
            minInterval: TIMING.PERIODIC_SYNC_INTERVAL,
          }
        );
        console.log(LOG_MESSAGES.PERIODIC_SYNC_REGISTERED);
      } else {
        console.log(LOG_MESSAGES.PERIODIC_SYNC_NO_PERMISSION);
      }
    } catch (error) {
      console.error(ERROR_MESSAGES.PERIODIC_SYNC_FAILED, error);
    }
  }
}

/**
 * 일일 알림 스케줄 생성 헬퍼
 */
export function createDailyReminderNotification(
  reminderTime: string,
  settings: {
    quietHours: boolean;
    quietStart: string;
    quietEnd: string;
  }
): ScheduledNotification {
  const now = new Date();
  const [hours, minutes] = reminderTime.split(":").map(Number);

  const scheduleTime = new Date();
  scheduleTime.setHours(hours, minutes, 0, 0);

  // 오늘 시간이 이미 지났다면 내일로 설정
  if (scheduleTime <= now) {
    scheduleTime.setDate(scheduleTime.getDate() + 1);
  }

  return {
    id: `daily-reminder-${Date.now()}`,
    type: NOTIFICATION_TYPES.DAILY_REMINDER,
    title: NOTIFICATION_MESSAGES.DAILY_REMINDER.TITLE,
    body: NOTIFICATION_MESSAGES.DAILY_REMINDER.BODY,
    scheduleTime: scheduleTime.toISOString(),
    tag: NOTIFICATION_TAGS.DAILY_BIBLE_REMINDER,
    requireInteraction: true,
    sent: false,
    createdAt: new Date().toISOString(),
    data: {
      type: NOTIFICATION_TYPES.DAILY_REMINDER,
      url: ROUTES.HOME,
    },
    settings,
  };
}
