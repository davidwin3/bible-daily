import { useEffect, useCallback } from "react";
import { useNotifications } from "./useNotifications";

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

    await showNotification("📖 성경 읽기 시간입니다!", {
      body: "오늘의 성경 말씀을 읽어보세요. 하나님의 말씀으로 하루를 시작하세요.",
      icon: "/vite.svg",
      badge: "/vite.svg",
      tag: "daily-bible-reminder",
      requireInteraction: true,
      data: {
        type: "daily-reminder",
        timestamp: Date.now(),
      },
    } as NotificationOptions & {
      actions?: Array<{
        action: string;
        title: string;
      }>;
    });

    console.log("📖 매일 성경 읽기 알림을 표시했습니다.");
  }, [permission, showNotification, isQuietHours]);

  // 다음 알림 스케줄링
  const scheduleNextReminder = useCallback(
    (settings: NotificationSettings) => {
      if (!settings.dailyReminder || permission !== "granted") {
        return;
      }

      const nextReminderTime = getNextReminderTime(
        settings.dailyReminderTime,
        settings
      );
      const delay = nextReminderTime.getTime() - Date.now();

      console.log(
        `📅 다음 성경 읽기 알림: ${nextReminderTime.toLocaleString()}`
      );

      // 기존 타이머 제거
      const existingTimerId = localStorage.getItem("daily-reminder-timer-id");
      if (existingTimerId) {
        clearTimeout(Number(existingTimerId));
      }

      // 새 타이머 설정
      const timerId = setTimeout(async () => {
        await showDailyReminder();

        // 알림 표시 후 다음 날 알림 스케줄링
        const updatedSettings = JSON.parse(
          localStorage.getItem("notificationSettings") || "{}"
        ) as NotificationSettings;

        if (updatedSettings.dailyReminder) {
          scheduleNextReminder(updatedSettings);
        }
      }, delay);

      // 타이머 ID 저장 (페이지 새로고침 시 정리용)
      localStorage.setItem("daily-reminder-timer-id", timerId.toString());
    },
    [permission, getNextReminderTime, showDailyReminder]
  );

  // 알림 스케줄 초기화
  const initializeDailyReminder = useCallback(() => {
    const settings = JSON.parse(
      localStorage.getItem("notificationSettings") || "{}"
    ) as Partial<NotificationSettings>;

    if (settings.dailyReminder && settings.dailyReminderTime) {
      scheduleNextReminder(settings as NotificationSettings);
    }
  }, [scheduleNextReminder]);

  // 알림 스케줄 취소
  const cancelDailyReminder = useCallback(() => {
    const existingTimerId = localStorage.getItem("daily-reminder-timer-id");
    if (existingTimerId) {
      clearTimeout(Number(existingTimerId));
      localStorage.removeItem("daily-reminder-timer-id");
      console.log("📖 매일 성경 읽기 알림이 취소되었습니다.");
    }
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
