import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/auth";
import {
  BellIcon,
  BellOffIcon,
  ClockIcon,
  HeartIcon,
  MessageSquareIcon,
  TargetIcon,
  ShieldIcon,
} from "lucide-react";

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
  const {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    scheduleLocalNotification,
    subscribeToPush,
    unsubscribeFromPush,
  } = useNotifications();

  const [settings, setSettings] =
    useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 로컬 스토리지에서 설정 불러오기
    const savedSettings = localStorage.getItem("notificationSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem("notificationSettings", JSON.stringify(newSettings));
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
          icon: "/vite.svg",
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
      icon: "/vite.svg",
    });
  };

  const handleScheduleTest = () => {
    scheduleLocalNotification(
      "예약된 알림 테스트",
      "5초 후에 도착한 알림입니다.",
      5000
    );
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
      <div className="space-y-6 pb-20">
        <Card>
          <CardContent className="py-8 text-center">
            <BellOffIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              알림 설정을 위해 로그인이 필요합니다
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 페이지 헤더 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BellIcon className="h-6 w-6" />
            알림 설정
          </CardTitle>
          <CardDescription>
            다양한 알림을 설정하여 Bible Daily를 더 효과적으로 활용해보세요
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 브라우저 알림 권한 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldIcon className="h-5 w-5" />
            알림 권한
          </CardTitle>
          <CardDescription>
            브라우저 알림을 받기 위해 권한 설정이 필요합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported ? (
            <div className="text-center py-4">
              <BellOffIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                이 브라우저는 알림을 지원하지 않습니다
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  브라우저 알림 상태:{" "}
                  <span
                    className={
                      permission === "granted"
                        ? "text-green-600"
                        : permission === "denied"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }
                  >
                    {permission === "granted"
                      ? "허용됨"
                      : permission === "denied"
                      ? "거부됨"
                      : "대기중"}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  푸시 알림과 로컬 알림을 받으려면 권한이 필요합니다
                </p>
              </div>
              <div className="flex gap-2">
                {permission !== "granted" ? (
                  <Button
                    onClick={handlePermissionRequest}
                    disabled={isLoading || permission === "denied"}
                  >
                    {isLoading ? "설정 중..." : "알림 허용"}
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleTestNotification}>
                      테스트
                    </Button>
                    <Button variant="outline" onClick={handleScheduleTest}>
                      예약 테스트
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDisableNotifications}
                      disabled={isLoading}
                    >
                      비활성화
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 로컬 알림 설정 */}
      {permission === "granted" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              로컬 알림
            </CardTitle>
            <CardDescription>
              앱에서 자동으로 생성되는 알림들을 설정할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 일일 리마인더 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">매일 성경 읽기 리마인더</Label>
                <p className="text-sm text-muted-foreground">
                  매일 정해진 시간에 성경 읽기 알림을 받습니다
                </p>
              </div>
              <Switch
                checked={settings.dailyReminder}
                onCheckedChange={(checked) =>
                  updateSetting("dailyReminder", checked)
                }
              />
            </div>

            {settings.dailyReminder && (
              <div className="ml-4 space-y-2">
                <Label htmlFor="reminderTime">알림 시간</Label>
                <Input
                  id="reminderTime"
                  type="time"
                  value={settings.dailyReminderTime}
                  onChange={(e) =>
                    updateSetting("dailyReminderTime", e.target.value)
                  }
                  className="w-32"
                />
              </div>
            )}

            <Separator />

            {/* 미션 마감 알림 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <TargetIcon className="h-4 w-4" />
                  미션 마감 알림
                </Label>
                <p className="text-sm text-muted-foreground">
                  미션 마감 전에 알림을 받습니다 (오후 9시)
                </p>
              </div>
              <Switch
                checked={settings.missionDeadline}
                onCheckedChange={(checked) =>
                  updateSetting("missionDeadline", checked)
                }
              />
            </div>

            <Separator />

            {/* 방해 금지 시간 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">방해 금지 시간</Label>
                <p className="text-sm text-muted-foreground">
                  지정된 시간 동안에는 알림을 받지 않습니다
                </p>
              </div>
              <Switch
                checked={settings.quietHours}
                onCheckedChange={(checked) =>
                  updateSetting("quietHours", checked)
                }
              />
            </div>

            {settings.quietHours && (
              <div className="ml-4 grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quietStart">시작 시간</Label>
                  <Input
                    id="quietStart"
                    type="time"
                    value={settings.quietStart}
                    onChange={(e) =>
                      updateSetting("quietStart", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="quietEnd">종료 시간</Label>
                  <Input
                    id="quietEnd"
                    type="time"
                    value={settings.quietEnd}
                    onChange={(e) => updateSetting("quietEnd", e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 푸시 알림 설정 */}
      {permission === "granted" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellIcon className="h-5 w-5" />
              서버 알림
            </CardTitle>
            <CardDescription>
              서버에서 전송되는 실시간 알림들을 설정할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <TargetIcon className="h-4 w-4" />새 미션 등록 알림
                </Label>
                <p className="text-sm text-muted-foreground">
                  새로운 성경 읽기 미션이 등록되면 알림을 받습니다
                </p>
              </div>
              <Switch
                checked={settings.newMission}
                onCheckedChange={(checked) =>
                  updateSetting("newMission", checked)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <HeartIcon className="h-4 w-4" />
                  좋아요 알림
                </Label>
                <p className="text-sm text-muted-foreground">
                  내 소감에 좋아요가 달리면 알림을 받습니다
                </p>
              </div>
              <Switch
                checked={settings.newLike}
                onCheckedChange={(checked) => updateSetting("newLike", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <MessageSquareIcon className="h-4 w-4" />셀 메시지 알림
                </Label>
                <p className="text-sm text-muted-foreground">
                  셀 담당자의 독려 메시지를 알림으로 받습니다
                </p>
              </div>
              <Switch
                checked={settings.cellMessages}
                onCheckedChange={(checked) =>
                  updateSetting("cellMessages", checked)
                }
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
