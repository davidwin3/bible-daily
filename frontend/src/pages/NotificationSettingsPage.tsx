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
  MoonIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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
      <div className="min-h-screen bg-gray-50/50 p-4">
        <div className="max-w-md mx-auto space-y-6 pt-8">
          <Card className="border-0 shadow-sm rounded-xl">
            <CardContent className="py-16 text-center px-6">
              <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-6">
                <BellOffIcon className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
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
    <div className="min-h-screen bg-gray-50/50">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
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
            <h1 className="text-lg font-semibold text-gray-900">알림 설정</h1>
            <p className="text-sm text-gray-600">
              맞춤형 알림으로 더 나은 경험을
            </p>
          </div>
        </div>
      </div>

      <div
        className="max-w-md mx-auto px-3 py-4 space-y-4 pb-24"
        style={{ marginTop: "0px" }}
      >
        {" "}
        {/* 헤더와 간격 제거 */}
        {/* 브라우저 알림 권한 */}
        <Card className="border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-3 px-4 pt-4">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <ShieldIcon className="h-4 w-4 text-blue-600" />
              </div>
              알림 권한
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-gray-600">
              브라우저 알림을 받기 위해 권한 설정이 필요합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 px-4 pb-4">
            {!isSupported ? (
              <div className="text-center py-8">
                <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                  <BellOffIcon className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  이 브라우저는 알림을 지원하지 않습니다
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        브라우저 알림 상태
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          permission === "granted"
                            ? "bg-green-100 text-green-700"
                            : permission === "denied"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {permission === "granted"
                          ? "허용됨"
                          : permission === "denied"
                          ? "거부됨"
                          : "대기중"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      푸시 알림과 로컬 알림을 받으려면 권한이 필요합니다
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {permission !== "granted" ? (
                    <Button
                      onClick={handlePermissionRequest}
                      disabled={isLoading || permission === "denied"}
                      className="h-10 text-sm px-6 rounded-lg font-medium"
                      size="sm"
                    >
                      {isLoading ? "설정 중..." : "알림 허용"}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleTestNotification}
                        size="sm"
                        className="h-10 text-sm px-4 rounded-lg border-gray-200"
                      >
                        테스트
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleScheduleTest}
                        size="sm"
                        className="h-10 text-sm px-4 rounded-lg border-gray-200"
                      >
                        예약 테스트
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDisableNotifications}
                        disabled={isLoading}
                        size="sm"
                        className="h-10 text-sm px-4 rounded-lg"
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
          <Card className="border-0 shadow-sm rounded-xl">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="p-2.5 bg-green-50 rounded-xl">
                  <ClockIcon className="h-4 w-4 text-green-600" />
                </div>
                로컬 알림
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed text-gray-600">
                앱에서 자동으로 생성되는 알림들을 설정할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4 space-y-6">
              {/* 일일 리마인더 */}
              <div className="space-y-3">
                <div className="flex items-start justify-between min-h-[44px]">
                  <div className="flex-1 min-w-0 pr-3">
                    <Label className="text-sm font-medium text-gray-900 leading-tight">
                      매일 성경 읽기 리마인더
                    </Label>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      매일 정해진 시간에 성경 읽기 알림을 받습니다
                    </p>
                  </div>
                  <Switch
                    checked={settings.dailyReminder}
                    onCheckedChange={(checked) =>
                      updateSetting("dailyReminder", checked)
                    }
                    className="flex-shrink-0"
                  />
                </div>

                {settings.dailyReminder && (
                  <div className="ml-0 pl-4 border-l-2 border-gray-100 space-y-2">
                    <Label
                      htmlFor="reminderTime"
                      className="text-sm text-gray-700"
                    >
                      알림 시간
                    </Label>
                    <Input
                      id="reminderTime"
                      type="time"
                      value={settings.dailyReminderTime}
                      onChange={(e) =>
                        updateSetting("dailyReminderTime", e.target.value)
                      }
                      className="w-36 h-10"
                    />
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* 미션 마감 알림 */}
              <div className="flex items-start justify-between min-h-[44px]">
                <div className="flex-1 min-w-0 pr-3">
                  <Label className="text-sm font-medium text-gray-900 flex items-center gap-2 leading-tight">
                    <TargetIcon className="h-3.5 w-3.5 text-orange-500" />
                    미션 마감 알림
                  </Label>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    미션 마감 전에 알림을 받습니다 (오후 9시)
                  </p>
                </div>
                <Switch
                  checked={settings.missionDeadline}
                  onCheckedChange={(checked) =>
                    updateSetting("missionDeadline", checked)
                  }
                  className="flex-shrink-0"
                />
              </div>

              <Separator className="my-4" />

              {/* 방해 금지 시간 */}
              <div className="space-y-3">
                <div className="flex items-start justify-between min-h-[44px]">
                  <div className="flex-1 min-w-0 pr-3">
                    <Label className="text-sm font-medium text-gray-900 flex items-center gap-2 leading-tight">
                      <MoonIcon className="h-3.5 w-3.5 text-purple-500" />
                      방해 금지 시간
                    </Label>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      지정된 시간 동안에는 알림을 받지 않습니다
                    </p>
                  </div>
                  <Switch
                    checked={settings.quietHours}
                    onCheckedChange={(checked) =>
                      updateSetting("quietHours", checked)
                    }
                    className="flex-shrink-0"
                  />
                </div>

                {settings.quietHours && (
                  <div className="ml-0 pl-4 border-l-2 border-gray-100 grid grid-cols-2 gap-3">
                    <div>
                      <Label
                        htmlFor="quietStart"
                        className="text-sm text-gray-700"
                      >
                        시작 시간
                      </Label>
                      <Input
                        id="quietStart"
                        type="time"
                        value={settings.quietStart}
                        onChange={(e) =>
                          updateSetting("quietStart", e.target.value)
                        }
                        className="h-10 mt-1"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="quietEnd"
                        className="text-sm text-gray-700"
                      >
                        종료 시간
                      </Label>
                      <Input
                        id="quietEnd"
                        type="time"
                        value={settings.quietEnd}
                        onChange={(e) =>
                          updateSetting("quietEnd", e.target.value)
                        }
                        className="h-10 mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        {/* 푸시 알림 설정 */}
        {permission === "granted" && (
          <Card className="border-0 shadow-sm rounded-xl">
            <CardHeader className="pb-3 px-4 pt-4">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="p-2.5 bg-orange-50 rounded-xl">
                  <BellIcon className="h-4 w-4 text-orange-600" />
                </div>
                서버 알림
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed text-gray-600">
                서버에서 전송되는 실시간 알림들을 설정할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4 space-y-6">
              <div className="flex items-start justify-between min-h-[44px]">
                <div className="flex-1 min-w-0 pr-3">
                  <Label className="text-sm font-medium text-gray-900 flex items-center gap-2 leading-tight">
                    <TargetIcon className="h-3.5 w-3.5 text-blue-500" />새 미션
                    등록 알림
                  </Label>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    새로운 성경 읽기 미션이 등록되면 알림을 받습니다
                  </p>
                </div>
                <Switch
                  checked={settings.newMission}
                  onCheckedChange={(checked) =>
                    updateSetting("newMission", checked)
                  }
                  className="flex-shrink-0"
                />
              </div>

              <Separator className="my-4" />

              <div className="flex items-start justify-between min-h-[44px]">
                <div className="flex-1 min-w-0 pr-3">
                  <Label className="text-sm font-medium text-gray-900 flex items-center gap-2 leading-tight">
                    <HeartIcon className="h-3.5 w-3.5 text-red-500" />
                    좋아요 알림
                  </Label>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    내 소감에 좋아요가 달리면 알림을 받습니다
                  </p>
                </div>
                <Switch
                  checked={settings.newLike}
                  onCheckedChange={(checked) =>
                    updateSetting("newLike", checked)
                  }
                  className="flex-shrink-0"
                />
              </div>

              <Separator className="my-4" />

              <div className="flex items-start justify-between min-h-[44px]">
                <div className="flex-1 min-w-0 pr-3">
                  <Label className="text-sm font-medium text-gray-900 flex items-center gap-2 leading-tight">
                    <MessageSquareIcon className="h-3.5 w-3.5 text-indigo-500" />
                    셀 메시지 알림
                  </Label>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    셀 담당자의 독려 메시지를 알림으로 받습니다
                  </p>
                </div>
                <Switch
                  checked={settings.cellMessages}
                  onCheckedChange={(checked) =>
                    updateSetting("cellMessages", checked)
                  }
                  className="flex-shrink-0"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
