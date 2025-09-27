import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { NotificationPermissionModal } from "@/components/notifications/NotificationPermissionModal";
import { usePWAEnvironment } from "@/hooks/usePWAEnvironment";
import { STORAGE_KEYS } from "@/constants";
import { useEventTracking } from "@/hooks/useAnalytics";

export const LoginPage: React.FC = () => {
  const { login, user, loading, pendingRegistration } = useAuth();
  const navigate = useNavigate();
  const { isPWA, isLoading: isPWALoading } = usePWAEnvironment();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const { trackButtonClick, trackEvent } = useEventTracking();

  useEffect(() => {
    if (user) {
      // 로그인 성공 후 PWA 환경에서 알림 권한 요청
      if (isPWA && !isPWALoading && isFirstLogin) {
        const hasRequestedPermission = localStorage.getItem(
          STORAGE_KEYS.NOTIFICATION_PERMISSION_REQUESTED
        );

        // 이전에 권한을 요청한 적이 없고, 현재 권한이 default 상태인 경우에만 모달 표시
        if (!hasRequestedPermission && Notification.permission === "default") {
          setShowNotificationModal(true);
        } else {
          navigate("/", { replace: true });
        }
      } else {
        navigate("/", { replace: true });
      }
    } else if (pendingRegistration) {
      navigate("/complete-registration", { replace: true });
    }
  }, [user, pendingRegistration, navigate, isPWA, isPWALoading, isFirstLogin]);

  const handleGoogleLogin = async () => {
    try {
      trackButtonClick("google_login", {
        event_category: "authentication",
        custom_parameters: { login_method: "google" },
      });

      setIsFirstLogin(true); // 로그인 시도 시 첫 로그인으로 표시
      await login();

      trackEvent("login_success", {
        event_category: "authentication",
        custom_parameters: { login_method: "google" },
      });
    } catch (error) {
      console.error("Login failed:", error);
      trackEvent("login_failed", {
        event_category: "authentication",
        custom_parameters: {
          login_method: "google",
          error_message:
            error instanceof Error ? error.message : "Unknown error",
        },
      });
      setIsFirstLogin(false); // 로그인 실패 시 초기화
    }
  };

  const handleNotificationModalClose = () => {
    setShowNotificationModal(false);
    setIsFirstLogin(false);
    navigate("/", { replace: true });
  };

  const handleNotificationPermissionGranted = () => {
    console.log("알림 권한이 허용되었습니다.");
  };

  const handleNotificationPermissionDenied = () => {
    console.log("알림 권한이 거부되었습니다.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              Bible Daily
            </CardTitle>
            <CardDescription>
              성경말씀을 나누고 소통하는 공간에 오신 것을 환영합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                구글 계정으로 간편하게 시작하세요
              </p>
            </div>
            <Button
              onClick={handleGoogleLogin}
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  로그인 중...
                </>
              ) : (
                "구글로 로그인"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 알림 권한 요청 모달 */}
      <NotificationPermissionModal
        isOpen={showNotificationModal}
        onClose={handleNotificationModalClose}
        onPermissionGranted={handleNotificationPermissionGranted}
        onPermissionDenied={handleNotificationPermissionDenied}
      />
    </>
  );
};
