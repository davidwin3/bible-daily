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
import { Bell, BellOff } from "lucide-react";
import { getFCMToken, requestNotificationPermission } from "@/lib/firebase";
import { api } from "@/lib/api";

export function NotificationSettings() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    // 현재 알림 권한 상태 확인
    if ("Notification" in window) {
      setPermission(Notification.permission);
      setIsEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleToggleNotifications = async (enabled: boolean) => {
    setIsLoading(true);

    try {
      if (enabled) {
        // 알림 권한 요청
        const granted = await requestNotificationPermission();

        if (granted) {
          // FCM 토큰 가져오기
          const token = await getFCMToken();

          if (token) {
            // 서버에 토큰 저장
            await api.post("/notifications/subscribe", {
              fcmToken: token,
            });

            setFcmToken(token);
            setIsEnabled(true);
            setPermission("granted");

            // 테스트 알림 전송
            await sendTestNotification();
          } else {
            throw new Error("FCM 토큰을 가져올 수 없습니다.");
          }
        } else {
          setIsEnabled(false);
          alert(
            "알림 권한이 필요합니다. 브라우저 설정에서 알림을 허용해주세요."
          );
        }
      } else {
        // 알림 비활성화
        if (fcmToken) {
          await api.delete("/notifications/unsubscribe", {
            data: { fcmToken },
          });
        }

        setIsEnabled(false);
        setFcmToken(null);
      }
    } catch (error) {
      console.error("알림 설정 중 오류:", error);
      alert("알림 설정 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      await api.post("/notifications/test");
    } catch (error) {
      console.error("테스트 알림 전송 실패:", error);
    }
  };

  const getStatusText = () => {
    switch (permission) {
      case "granted":
        return "알림이 허용되었습니다";
      case "denied":
        return "알림이 차단되었습니다";
      default:
        return "알림 권한을 요청하지 않았습니다";
    }
  };

  const getStatusColor = () => {
    switch (permission) {
      case "granted":
        return "text-green-600";
      case "denied":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
          푸시 알림 설정
        </CardTitle>
        <CardDescription>
          새로운 미션, 게시물 업데이트 등 중요한 알림을 받아보세요.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 알림 상태 */}
        <div className="space-y-2">
          <Label>현재 상태</Label>
          <p className={`text-sm ${getStatusColor()}`}>{getStatusText()}</p>
        </div>

        {/* 알림 토글 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="notifications">푸시 알림 받기</Label>
            <p className="text-sm text-muted-foreground">
              중요한 알림을 실시간으로 받아보세요
            </p>
          </div>
          <Switch
            id="notifications"
            checked={isEnabled}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading}
          />
        </div>

        {/* 테스트 버튼 */}
        {isEnabled && (
          <div className="pt-4 border-t">
            <Button
              onClick={sendTestNotification}
              variant="outline"
              disabled={isLoading}
              className="w-full"
            >
              테스트 알림 보내기
            </Button>
          </div>
        )}

        {/* 차단된 경우 안내 */}
        {permission === "denied" && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              알림이 차단되어 있습니다. 브라우저 설정에서 알림을 허용한 후
              페이지를 새로고침하세요.
            </p>
            <ul className="mt-2 text-xs text-orange-700 list-disc list-inside">
              <li>Chrome: 주소창 왼쪽 자물쇠 아이콘 → 알림 허용</li>
              <li>Safari: 환경설정 → 웹사이트 → 알림</li>
              <li>Firefox: 주소창 방패 아이콘 → 알림 허용</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
