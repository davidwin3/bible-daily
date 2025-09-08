import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePWADebug } from "@/hooks/usePWADebug";
import {
  RefreshCw,
  Trash2,
  Download,
  Bell,
  Wifi,
  WifiOff,
  Monitor,
  Smartphone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";

interface PWADebugPanelProps {
  className?: string;
}

export function PWADebugPanel({ className }: PWADebugPanelProps) {
  const {
    debugInfo,
    refreshDebugInfo,
    clearCaches,
    updateServiceWorker,
    installPWA,
    sendTestNotification,
  } = usePWADebug();

  const getStatusIcon = (status: boolean | string) => {
    if (typeof status === "boolean") {
      return status ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      );
    }

    switch (status) {
      case "granted":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "denied":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "activated":
      case "installing":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (
    status: boolean | string,
    trueText = "활성",
    falseText = "비활성"
  ) => {
    if (typeof status === "boolean") {
      return (
        <Badge variant={status ? "default" : "secondary"}>
          {status ? trueText : falseText}
        </Badge>
      );
    }

    const getVariant = () => {
      switch (status) {
        case "granted":
        case "activated":
          return "default";
        case "denied":
          return "destructive";
        default:
          return "secondary";
      }
    };

    return <Badge variant={getVariant()}>{status}</Badge>;
  };

  return (
    <Card className={`w-full h-full flex flex-col ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              PWA 디버그 패널
            </CardTitle>
            <CardDescription>
              Progressive Web App 상태 및 기능 디버깅
            </CardDescription>
          </div>
          <Button onClick={refreshDebugInfo} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="h-full w-full overflow-y-auto p-6">
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">네트워크 상태</span>
                  <div className="flex items-center gap-2">
                    {debugInfo.isOnline ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    {getStatusBadge(debugInfo.isOnline, "온라인", "오프라인")}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">연결 타입</span>
                  <Badge variant="outline">{debugInfo.connectionType}</Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">설치 모드</span>
                  <div className="flex items-center gap-2">
                    {debugInfo.isStandalone ? (
                      <Smartphone className="h-4 w-4 text-green-500" />
                    ) : (
                      <Monitor className="h-4 w-4 text-blue-500" />
                    )}
                    {getStatusBadge(
                      debugInfo.isStandalone,
                      "앱 모드",
                      "브라우저"
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">User Agent</span>
                  <Badge variant="outline" className="max-w-[150px] truncate">
                    {debugInfo.userAgent.split(" ")[0]}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Service Worker 정보 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Service Worker</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">지원 여부</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugInfo.isServiceWorkerSupported)}
                    {getStatusBadge(
                      debugInfo.isServiceWorkerSupported,
                      "지원",
                      "미지원"
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">상태</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(
                      debugInfo.serviceWorkerState === "activated"
                    )}
                    {getStatusBadge(debugInfo.serviceWorkerState)}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">등록 정보</span>
                  <Badge
                    variant={
                      debugInfo.serviceWorkerRegistration
                        ? "default"
                        : "secondary"
                    }
                  >
                    {debugInfo.serviceWorkerRegistration ? "등록됨" : "미등록"}
                  </Badge>
                </div>

                {debugInfo.serviceWorkerRegistration && (
                  <Button
                    onClick={updateServiceWorker}
                    size="sm"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Service Worker 업데이트
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* 푸시 알림 정보 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">푸시 알림</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">지원 여부</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugInfo.isNotificationSupported)}
                    {getStatusBadge(
                      debugInfo.isNotificationSupported,
                      "지원",
                      "미지원"
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">권한 상태</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugInfo.notificationPermission)}
                    {getStatusBadge(debugInfo.notificationPermission)}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">푸시 구독</span>
                  <Badge
                    variant={
                      debugInfo.pushSubscription ? "default" : "secondary"
                    }
                  >
                    {debugInfo.pushSubscription ? "구독 중" : "미구독"}
                  </Badge>
                </div>

                {debugInfo.notificationPermission === "granted" && (
                  <Button
                    onClick={sendTestNotification}
                    size="sm"
                    className="w-full"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    테스트 알림 전송
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* PWA 설치 정보 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">PWA 설치</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">설치 가능</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugInfo.isInstallable)}
                    {getStatusBadge(debugInfo.isInstallable, "가능", "불가능")}
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">설치 상태</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(debugInfo.isInstalled)}
                    {getStatusBadge(debugInfo.isInstalled, "설치됨", "미설치")}
                  </div>
                </div>

                {debugInfo.isInstallable && !debugInfo.isInstalled && (
                  <Button onClick={installPWA} size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    PWA 설치하기
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* 캐시 정보 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">캐시 관리</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">캐시 개수</span>
                  <Badge variant="outline">
                    {debugInfo.cacheNames.length}개
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">캐시된 항목</span>
                  <Badge variant="outline">{debugInfo.cacheSize}개</Badge>
                </div>

                {debugInfo.cacheNames.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">캐시 목록:</div>
                    <div className="space-y-1">
                      {debugInfo.cacheNames.map((cacheName, index) => (
                        <div
                          key={index}
                          className="text-xs p-2 bg-background rounded border"
                        >
                          {cacheName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={clearCaches}
                  size="sm"
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  모든 캐시 클리어
                </Button>
              </div>
            </div>

            <Separator />

            {/* 개발자 정보 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">개발자 정보</h3>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-muted rounded">
                  <strong>환경:</strong> {process.env.NODE_ENV}
                </div>
                <div className="p-2 bg-muted rounded">
                  <strong>빌드 시간:</strong> {new Date().toLocaleString()}
                </div>
                <div className="p-2 bg-muted rounded">
                  <strong>화면 크기:</strong> {window.innerWidth} x{" "}
                  {window.innerHeight}
                </div>
                <div className="p-2 bg-muted rounded">
                  <strong>Viewport:</strong> {window.screen.width} x{" "}
                  {window.screen.height}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
