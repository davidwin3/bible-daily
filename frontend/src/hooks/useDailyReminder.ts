import { useEffect, useCallback } from "react";
import { useNotifications } from "./useNotifications";
import {
  saveScheduledNotification,
  deleteNotificationsByType,
  createDailyReminderNotification,
  requestBackgroundSync,
  registerPeriodicBackgroundSync,
} from "@/lib/backgroundNotifications";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_MESSAGES,
  NOTIFICATION_TAGS,
  NOTIFICATION_ICONS,
  STORAGE_KEYS,
  TIMING,
  LOG_MESSAGES,
  ERROR_MESSAGES,
} from "@/constants";

interface NotificationSettings {
  dailyReminder: boolean;
  dailyReminderTime: string;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
}

export const useDailyReminder = () => {
  const { permission, showNotification } = useNotifications();

  // 다음 알림 시간 계산 (방해 금지 시간 고려)
  const getNextReminderTime = useCallback(
    (reminderTime: string, settings?: NotificationSettings): Date => {
      const now = new Date();
      const [hours, minutes] = reminderTime.split(":").map(Number);

      const nextReminder = new Date();
      nextReminder.setHours(hours, minutes, 0, 0);

      // 오늘 시간이 이미 지났다면 내일로 설정
      if (nextReminder <= now) {
        nextReminder.setDate(nextReminder.getDate() + 1);
      }

      // 방해 금지 시간 체크 및 조정
      if (settings?.quietHours) {
        const reminderTimeMinutes = hours * 60 + minutes;
        const [startHour, startMin] = settings.quietStart
          .split(":")
          .map(Number);
        const [endHour, endMin] = settings.quietEnd.split(":").map(Number);

        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        // 알림 시간이 방해 금지 시간에 포함되는지 확인
        let isInQuietTime = false;

        if (startTime > endTime) {
          // 자정을 넘나드는 경우
          isInQuietTime =
            reminderTimeMinutes >= startTime || reminderTimeMinutes <= endTime;
        } else {
          // 같은 날 내의 시간 범위
          isInQuietTime =
            reminderTimeMinutes >= startTime && reminderTimeMinutes <= endTime;
        }

        if (isInQuietTime) {
          // 방해 금지 시간이 끝난 후로 알림 시간 조정
          if (startTime > endTime) {
            // 자정을 넘나드는 경우, 다음 날 방해 금지 종료 시간으로 설정
            nextReminder.setHours(endHour, endMin, 0, 0);
            if (reminderTimeMinutes >= startTime) {
              // 오늘 밤 시작된 방해 금지 시간이면 내일 아침 종료 시간
              nextReminder.setDate(nextReminder.getDate() + 1);
            }
          } else {
            // 같은 날 내의 방해 금지 시간이면 종료 시간으로 설정
            nextReminder.setHours(endHour, endMin, 0, 0);
          }

          console.log(
            `⏰ 방해 금지 시간으로 인해 알림 시간이 조정되었습니다: ${nextReminder.toLocaleString()}`
          );
        }
      }

      return nextReminder;
    },
    []
  );

  // 방해 금지 시간 체크
  const isQuietHours = useCallback(
    (settings: NotificationSettings): boolean => {
      if (!settings.quietHours) return false;

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const [startHour, startMin] = settings.quietStart.split(":").map(Number);
      const [endHour, endMin] = settings.quietEnd.split(":").map(Number);

      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      // 자정을 넘나드는 경우 처리 (예: 22:00 ~ 07:00)
      if (startTime > endTime) {
        return currentTime >= startTime || currentTime <= endTime;
      } else {
        // 같은 날 내의 시간 범위 (예: 12:00 ~ 14:00)
        return currentTime >= startTime && currentTime <= endTime;
      }
    },
    []
  );

  // 매일 성경 읽기 알림 표시
  const showDailyReminder = useCallback(async () => {
    if (permission !== "granted") {
      console.warn("알림 권한이 없습니다.");
      return;
    }

    const settings = JSON.parse(
      localStorage.getItem("notificationSettings") || "{}"
    ) as Partial<NotificationSettings>;

    // 방해 금지 시간 체크
    if (isQuietHours(settings as NotificationSettings)) {
      console.log("방해 금지 시간입니다. 알림을 건너뜁니다.");
      return;
    }

    await showNotification(NOTIFICATION_MESSAGES.DAILY_REMINDER.TITLE, {
      body: NOTIFICATION_MESSAGES.DAILY_REMINDER.BODY,
      icon: NOTIFICATION_ICONS.DEFAULT,
      badge: NOTIFICATION_ICONS.BADGE,
      tag: NOTIFICATION_TAGS.DAILY_BIBLE_REMINDER,
      requireInteraction: true,
      data: {
        type: NOTIFICATION_TYPES.DAILY_REMINDER,
        timestamp: Date.now(),
      },
    } as NotificationOptions & {
      actions?: Array<{
        action: string;
        title: string;
      }>;
    });

    console.log(LOG_MESSAGES.DAILY_REMINDER_SHOWN);
  }, [permission, showNotification, isQuietHours]);

  // 다음 알림 스케줄링 (백그라운드 알림 지원)
  const scheduleNextReminder = useCallback(
    async (settings: NotificationSettings) => {
      if (!settings.dailyReminder || permission !== "granted") {
        return;
      }

      try {
        // 기존 일일 알림 스케줄 삭제
        await deleteNotificationsByType(NOTIFICATION_TYPES.DAILY_REMINDER);

        // 기존 타이머도 정리
        const existingTimerId = localStorage.getItem(STORAGE_KEYS.TIMER_ID);
        if (existingTimerId) {
          clearTimeout(Number(existingTimerId));
          localStorage.removeItem(STORAGE_KEYS.TIMER_ID);
        }

        // 백그라운드 알림 스케줄 생성
        const notification = createDailyReminderNotification(
          settings.dailyReminderTime,
          {
            quietHours: settings.quietHours,
            quietStart: settings.quietStart,
            quietEnd: settings.quietEnd,
          }
        );

        await saveScheduledNotification(notification);

        console.log(
          `${LOG_MESSAGES.BACKGROUND_SCHEDULED} ${new Date(
            notification.scheduleTime
          ).toLocaleString()}`
        );

        // 백그라운드 동기화 요청
        await requestBackgroundSync();

        // 주기적 백그라운드 동기화 등록 (PWA 환경에서만)
        await registerPeriodicBackgroundSync();

        // 폴백용 앱 내 타이머도 설정 (앱이 실행 중일 때 빠른 응답용)
        const nextReminderTime = getNextReminderTime(
          settings.dailyReminderTime,
          settings
        );
        const delay = nextReminderTime.getTime() - Date.now();

        if (delay > 0 && delay < TIMING.FALLBACK_TIMER_THRESHOLD) {
          // 24시간 이내면 앱 내 타이머도 설정
          const timerId = setTimeout(async () => {
            await showDailyReminder();

            // 앱 내 타이머 실행 후에도 다음 날 스케줄링
            const updatedSettings = JSON.parse(
              localStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS) || "{}"
            ) as NotificationSettings;

            if (updatedSettings.dailyReminder) {
              scheduleNextReminder(updatedSettings);
            }
          }, delay);

          localStorage.setItem(STORAGE_KEYS.TIMER_ID, timerId.toString());
          console.log(
            `${
              LOG_MESSAGES.FALLBACK_TIMER_SET
            } ${nextReminderTime.toLocaleString()}`
          );
        }
      } catch (error) {
        console.error(ERROR_MESSAGES.NOTIFICATION_SCHEDULE_ERROR, error);

        // 백그라운드 알림 실패 시 기존 방식으로 폴백
        const nextReminderTime = getNextReminderTime(
          settings.dailyReminderTime,
          settings
        );
        const delay = nextReminderTime.getTime() - Date.now();

        if (delay > 0) {
          const timerId = setTimeout(async () => {
            await showDailyReminder();
            const updatedSettings = JSON.parse(
              localStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS) || "{}"
            ) as NotificationSettings;

            if (updatedSettings.dailyReminder) {
              scheduleNextReminder(updatedSettings);
            }
          }, delay);

          localStorage.setItem(STORAGE_KEYS.TIMER_ID, timerId.toString());
          console.log(
            `${LOG_MESSAGES.FALLBACK_MODE} ${nextReminderTime.toLocaleString()}`
          );
        }
      }
    },
    [permission, getNextReminderTime, showDailyReminder]
  );

  // 알림 스케줄 초기화
  const initializeDailyReminder = useCallback(() => {
    const settings = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS) || "{}"
    ) as Partial<NotificationSettings>;

    if (settings.dailyReminder && settings.dailyReminderTime) {
      scheduleNextReminder(settings as NotificationSettings);
    }
  }, [scheduleNextReminder]);

  // 알림 스케줄 취소 (백그라운드 알림 포함)
  const cancelDailyReminder = useCallback(async () => {
    try {
      // 백그라운드 알림 스케줄 삭제
      await deleteNotificationsByType(NOTIFICATION_TYPES.DAILY_REMINDER);
      console.log(LOG_MESSAGES.BACKGROUND_SCHEDULE_DELETED);
    } catch (error) {
      console.error(ERROR_MESSAGES.NOTIFICATION_DELETE_ERROR, error);
    }

    // 앱 내 타이머도 정리
    const existingTimerId = localStorage.getItem(STORAGE_KEYS.TIMER_ID);
    if (existingTimerId) {
      clearTimeout(Number(existingTimerId));
      localStorage.removeItem(STORAGE_KEYS.TIMER_ID);
      console.log(LOG_MESSAGES.APP_TIMER_CANCELLED);
    }

    console.log(LOG_MESSAGES.DAILY_REMINDER_CANCELLED);
  }, []);

  // 컴포넌트 마운트 시 알림 초기화
  useEffect(() => {
    if (permission === "granted") {
      initializeDailyReminder();
    }

    // 페이지 언로드 시 타이머 정리
    const handleBeforeUnload = () => {
      // 타이머는 유지하되, 새로고침 시에는 다시 초기화됨
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [permission, initializeDailyReminder]);

  return {
    scheduleNextReminder,
    cancelDailyReminder,
    initializeDailyReminder,
    showDailyReminder,
  };
};
