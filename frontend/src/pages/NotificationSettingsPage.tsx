import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNotifications } from "@/hooks/useNotifications";
import { useDailyReminder } from "@/hooks/useDailyReminder";
import { useAuth } from "@/contexts/auth";
import { BellOffIcon, ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NotificationPermissionCard } from "@/components/notifications/NotificationPermissionCard";
import { LocalNotificationSettings } from "@/components/notifications/LocalNotificationSettings";
import { ServerNotificationSettings } from "@/components/notifications/ServerNotificationSettings";
import { STORAGE_KEYS } from "@/constants";

interface NotificationSettings {
  dailyReminder: boolean;
  dailyReminderTime: string;
  missionDeadline: boolean;
  newMission: boolean;
  newLike: boolean;
  cellMessages: boolean;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyReminder: true,
  dailyReminderTime: "09:00",
  missionDeadline: true,
  newMission: true,
  newLike: true,
  cellMessages: true,
  quietHours: false,
  quietStart: "22:00",
  quietEnd: "07:00",
};

export const NotificationSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    scheduleLocalNotification,
    subscribeToPush,
    unsubscribeFromPush,
  } = useNotifications();

  const { scheduleNextReminder, cancelDailyReminder } = useDailyReminder();

  // 다음 알림 시간 계산
  const getNextReminderDisplay = () => {
    if (!settings.dailyReminder || !settings.dailyReminderTime) {
      return null;
    }

    const now = new Date();
    const [hours, minutes] = settings.dailyReminderTime.split(":").map(Number);

    const nextReminder = new Date();
    nextReminder.setHours(hours, minutes, 0, 0);

    // 오늘 시간이 이미 지났다면 내일로 설정
    if (nextReminder <= now) {
      nextReminder.setDate(nextReminder.getDate() + 1);
    }

    return nextReminder.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [settings, setSettings] =
    useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 설정 불러오기
    const savedSettings = localStorage.getItem(
      STORAGE_KEYS.NOTIFICATION_SETTINGS
    );
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem(
      STORAGE_KEYS.NOTIFICATION_SETTINGS,
      JSON.stringify(newSettings)
    );

    // 매일 성경 읽기 리마인더 설정 변경 시 스케줄 업데이트
    if (newSettings.dailyReminder && newSettings.dailyReminderTime) {
      scheduleNextReminder(newSettings);
    } else {
      cancelDailyReminder();
    }
  };

  const handlePermissionRequest = async () => {
    setIsLoading(true);
    try {
      const result = await requestPermission();
      if (result === "granted") {
        await subscribeToPush();
        // 테스트 알림 전송
        await showNotification("알림이 활성화되었습니다!", {
          body: "Bible Daily 알림을 받을 수 있습니다.",
          icon: "/icons/192.png",
        });
      }
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      await unsubscribeFromPush();
    } catch (error) {
      console.error("Failed to disable notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = () => {
    showNotification("테스트 알림", {
      body: "알림이 정상적으로 작동합니다!",
      icon: "/icons/192.png",
    });
  };

  const handleScheduleTest = () => {
    scheduleLocalNotification(
      "예약된 알림 테스트",
      "5초 후에 도착한 알림입니다.",
      5000
    );
  };

  const handleDailyReminderTest = () => {
    showNotification("📖 성경 읽기 시간입니다! (테스트)", {
      body: "오늘의 성경 말씀을 읽어보세요. 하나님의 말씀으로 하루를 시작하세요.",
      icon: "/icons/192.png",
      badge: "/icons/192.png",
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
  };

  const updateSetting = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 p-4">
        <div className="max-w-md mx-auto space-y-6 pt-8">
          <Card className="border-0 shadow-sm rounded-xl">
            <CardContent className="py-16 text-center px-6">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto mb-6">
                <BellOffIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                로그인이 필요합니다
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                알림 설정을 위해 로그인해주세요
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mr-2 -ml-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">알림 설정</h1>
            <p className="text-sm text-muted-foreground">
              맞춤형 알림으로 더 나은 경험을
            </p>
          </div>
        </div>
      </div>

      <div
        className="mx-auto px-3 py-4 space-y-4 pb-24"
        style={{ marginTop: "0px" }}
      >
        {" "}
        {/* 헤더와 간격 제거 */}
        {/* 브라우저 알림 권한 */}
        <NotificationPermissionCard
          isSupported={isSupported}
          permission={permission}
          isLoading={isLoading}
          onRequestPermission={handlePermissionRequest}
          onTestNotification={handleTestNotification}
          onScheduleTest={handleScheduleTest}
          onDailyReminderTest={handleDailyReminderTest}
          onDisableNotifications={handleDisableNotifications}
        />
        {/* 로컬 알림 설정 */}
        {permission === "granted" && (
          <LocalNotificationSettings
            settings={{
              dailyReminder: settings.dailyReminder,
              dailyReminderTime: settings.dailyReminderTime,
              missionDeadline: settings.missionDeadline,
              quietHours: settings.quietHours,
              quietStart: settings.quietStart,
              quietEnd: settings.quietEnd,
            }}
            onUpdateSetting={updateSetting as any}
            getNextReminderDisplay={getNextReminderDisplay}
          />
        )}
        {/* 푸시 알림 설정 */}
        {permission === "granted" && (
          <ServerNotificationSettings
            settings={{
              newMission: settings.newMission,
              newLike: settings.newLike,
              cellMessages: settings.cellMessages,
            }}
            onUpdateSetting={updateSetting as any}
          />
        )}
      </div>
    </div>
  );
};
