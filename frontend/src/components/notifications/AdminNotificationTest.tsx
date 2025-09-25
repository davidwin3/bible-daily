import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { SettingsIcon, SendIcon } from "lucide-react";
import { useAuth } from "@/contexts/auth";

interface AdminNotificationTestProps {
  onSendToToken: (token: string, title: string, body: string) => Promise<void>;
  onSendToUser: (userId: string, title: string, body: string) => Promise<void>;
}

export const AdminNotificationTest: React.FC<AdminNotificationTestProps> = ({
  onSendToToken,
  onSendToUser,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState("");
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("테스트 알림");
  const [body, setBody] = useState("관리자가 전송한 테스트 알림입니다.");

  // 관리자가 아니면 렌더링하지 않음
  if (!user || user.role !== "admin") {
    return null;
  }

  const handleSendToToken = async () => {
    if (!fcmToken.trim() || !title.trim() || !body.trim()) {
      alert("FCM 토큰, 제목, 내용을 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await onSendToToken(fcmToken.trim(), title.trim(), body.trim());
      alert("알림이 성공적으로 전송되었습니다!");
    } catch (error) {
      console.error("Failed to send notification:", error);
      alert("알림 전송에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToUser = async () => {
    if (!userId.trim() || !title.trim() || !body.trim()) {
      alert("사용자 ID, 제목, 내용을 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await onSendToUser(userId.trim(), title.trim(), body.trim());
      alert("알림이 성공적으로 전송되었습니다!");
    } catch (error) {
      console.error("Failed to send notification:", error);
      alert("알림 전송에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm rounded-xl">
      <CardHeader className="pb-3 px-4 pt-4">
        <CardTitle className="flex items-center gap-3 text-base">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
            <SettingsIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          관리자 테스트
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
          특정 사용자에게 테스트 알림을 전송할 수 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4 space-y-6">
        {/* 알림 내용 설정 */}
        <div className="space-y-3">
          <div>
            <Label
              htmlFor="notificationTitle"
              className="text-sm text-muted-foreground"
            >
              알림 제목
            </Label>
            <Input
              id="notificationTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="알림 제목을 입력하세요"
              className="h-10 mt-1"
            />
          </div>
          <div>
            <Label
              htmlFor="notificationBody"
              className="text-sm text-muted-foreground"
            >
              알림 내용
            </Label>
            <Textarea
              id="notificationBody"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="알림 내용을 입력하세요"
              className="mt-1 min-h-[80px]"
            />
          </div>
        </div>

        <Separator className="my-4" />

        {/* FCM 토큰으로 전송 */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="fcmToken" className="text-sm text-muted-foreground">
              FCM 토큰으로 전송
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="fcmToken"
                value={fcmToken}
                onChange={(e) => setFcmToken(e.target.value)}
                placeholder="FCM 토큰을 입력하세요"
                className="h-10 flex-1"
              />
              <Button
                onClick={handleSendToToken}
                disabled={
                  isLoading || !fcmToken.trim() || !title.trim() || !body.trim()
                }
                size="sm"
                className="h-10 px-4 rounded-lg"
              >
                <SendIcon className="h-4 w-4 mr-1" />
                전송
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              브라우저 개발자 도구에서 FCM 토큰을 확인할 수 있습니다
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* 사용자 ID로 전송 */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="userId" className="text-sm text-muted-foreground">
              사용자 ID로 전송
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="사용자 ID를 입력하세요"
                className="h-10 flex-1"
              />
              <Button
                onClick={handleSendToUser}
                disabled={
                  isLoading || !userId.trim() || !title.trim() || !body.trim()
                }
                size="sm"
                className="h-10 px-4 rounded-lg"
              >
                <SendIcon className="h-4 w-4 mr-1" />
                전송
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              데이터베이스의 사용자 UUID를 입력하세요
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
