import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Smartphone } from "lucide-react";
import { requestNotificationPermission, getFCMToken } from "@/lib/firebase";
import { api } from "@/lib/api";
import { STORAGE_KEYS } from "@/constants";

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

export const NotificationPermissionModal: React.FC<
  NotificationPermissionModalProps
> = ({ isOpen, onClose, onPermissionGranted, onPermissionDenied }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      // 알림 권한 요청
      const granted = await requestNotificationPermission();

      if (granted) {
        // FCM 토큰 가져오기 및 서버 등록
        const token = await getFCMToken();
        if (token) {
          await api.post("/notifications/subscribe", {
            fcmToken: token,
          });
        }

        // 로컬 스토리지에 알림 설정 저장
        localStorage.setItem(STORAGE_KEYS.NOTIFICATION_ENABLED, "true");
        localStorage.setItem(
          STORAGE_KEYS.NOTIFICATION_PERMISSION_REQUESTED,
          "true"
        );

        onPermissionGranted?.();
        onClose();
      } else {
        // 권한 거부됨
        localStorage.setItem(
          STORAGE_KEYS.NOTIFICATION_PERMISSION_REQUESTED,
          "true"
        );
        onPermissionDenied?.();
        onClose();
      }
    } catch (error) {
      console.error("알림 권한 요청 중 오류:", error);
      onPermissionDenied?.();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // 나중에 요청하도록 설정하지 않음 (다음 로그인 시 다시 물어봄)
    onClose();
  };

  const handleNotNow = () => {
    // 권한 요청했다고 표시하여 다시 묻지 않음
    localStorage.setItem(
      STORAGE_KEYS.NOTIFICATION_PERMISSION_REQUESTED,
      "true"
    );
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            알림을 받으시겠어요?
          </DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p>Bible Daily에서 다음과 같은 알림을 보내드려요:</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span>새로운 성경 말씀과 묵상</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Bell className="h-4 w-4" />
                <span>매일 성경 읽기 리마인더</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Bell className="h-4 w-4" />
                <span>새로운 게시글 및 댓글 알림</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              언제든지 설정에서 알림을 끄실 수 있어요.
            </p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleEnableNotifications}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                설정 중...
              </>
            ) : (
              <>
                <Bell className="mr-2 h-4 w-4" />
                알림 받기
              </>
            )}
          </Button>

          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isLoading}
              className="flex-1"
            >
              나중에
            </Button>
            <Button
              variant="ghost"
              onClick={handleNotNow}
              disabled={isLoading}
              className="flex-1"
            >
              <BellOff className="mr-2 h-4 w-4" />
              받지 않기
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
