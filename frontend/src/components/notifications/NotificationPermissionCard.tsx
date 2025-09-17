import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BellIcon, BellOffIcon, ShieldIcon } from "lucide-react";

interface NotificationPermissionCardProps {
  isSupported: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
  onRequestPermission: () => void;
  onTestNotification: () => void;
  onScheduleTest: () => void;
  onDailyReminderTest: () => void;
  onDisableNotifications: () => void;
}

export const NotificationPermissionCard: React.FC<
  NotificationPermissionCardProps
> = ({
  isSupported,
  permission,
  isLoading,
  onRequestPermission,
  onTestNotification,
  onScheduleTest,
  onDailyReminderTest,
  onDisableNotifications,
}) => {
  return (
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
                  onClick={onRequestPermission}
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
                    onClick={onTestNotification}
                    size="sm"
                    className="h-10 text-sm px-4 rounded-lg border-gray-200"
                  >
                    테스트
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onScheduleTest}
                    size="sm"
                    className="h-10 text-sm px-4 rounded-lg border-gray-200"
                  >
                    예약 테스트
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onDailyReminderTest}
                    size="sm"
                    className="h-10 text-sm px-4 rounded-lg border-gray-200"
                  >
                    성경 알림 테스트
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={onDisableNotifications}
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
  );
};
