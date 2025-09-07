import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  getBrowserEnvironment,
  registerServiceWorkerForPWA,
  unregisterServiceWorker,
  clearAllCaches,
  clearAPICacheOnly,
} from "../lib/pwa";

interface PWADebugPanelProps {
  isVisible?: boolean;
}

export function PWADebugPanel({ isVisible = false }: PWADebugPanelProps) {
  const [environment, setEnvironment] = useState(getBrowserEnvironment());
  const [isServiceWorkerActive, setIsServiceWorkerActive] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 환경 정보 업데이트
  const updateEnvironment = () => {
    setEnvironment(getBrowserEnvironment());
  };

  // Service Worker 상태 확인
  const checkServiceWorkerStatus = async () => {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      setIsServiceWorkerActive(!!registration);
    }
  };

  // 캐시 정보 확인
  const checkCacheInfo = async () => {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      setCacheInfo(cacheNames);
    }
  };

  // PWA 모드 강제 토글
  const togglePWAMode = () => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("pwa")) {
      url.searchParams.delete("pwa");
    } else {
      url.searchParams.set("pwa", "true");
    }
    window.location.href = url.toString();
  };

  // Service Worker 강제 등록
  const forceRegisterServiceWorker = async () => {
    setIsLoading(true);
    try {
      const registration = await registerServiceWorkerForPWA();
      if (registration) {
        console.log("Service Worker 강제 등록 성공");
        await checkServiceWorkerStatus();
      }
    } catch (error) {
      console.error("Service Worker 등록 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Service Worker 해제
  const forceUnregisterServiceWorker = async () => {
    setIsLoading(true);
    try {
      const success = await unregisterServiceWorker();
      if (success) {
        console.log("Service Worker 해제 성공");
        await checkServiceWorkerStatus();
      }
    } catch (error) {
      console.error("Service Worker 해제 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 전체 캐시 정리
  const forceClearAllCache = async () => {
    setIsLoading(true);
    try {
      await clearAllCaches();
      console.log("전체 캐시 정리 완료");
      await checkCacheInfo();
    } catch (error) {
      console.error("전체 캐시 정리 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // API 캐시만 정리
  const forceClearAPICache = async () => {
    setIsLoading(true);
    try {
      await clearAPICacheOnly();
      console.log("API 캐시 정리 완료");
      await checkCacheInfo();
    } catch (error) {
      console.error("API 캐시 정리 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updateEnvironment();
    checkServiceWorkerStatus();
    checkCacheInfo();

    // 주기적으로 상태 업데이트
    const interval = setInterval(() => {
      updateEnvironment();
      checkServiceWorkerStatus();
      checkCacheInfo();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible && process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 bg-white/95 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          PWA 디버그 패널
          <Badge variant={environment.isPWA ? "default" : "secondary"}>
            {environment.displayMode}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        {/* 환경 정보 */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">환경 정보</Label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>PWA: {environment.isPWA ? "✅" : "❌"}</div>
            <div>Standalone: {environment.isStandalone ? "✅" : "❌"}</div>
            <div>설치 가능: {environment.isInstallable ? "✅" : "❌"}</div>
            <div>SW 활성: {isServiceWorkerActive ? "✅" : "❌"}</div>
          </div>
        </div>

        {/* 컨트롤 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="pwa-mode" className="text-xs">
              PWA 모드 강제
            </Label>
            <Switch
              id="pwa-mode"
              checked={new URLSearchParams(window.location.search).has("pwa")}
              onCheckedChange={togglePWAMode}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={forceRegisterServiceWorker}
              disabled={isLoading}
              className="text-xs h-8"
            >
              SW 등록
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={forceUnregisterServiceWorker}
              disabled={isLoading}
              className="text-xs h-8"
            >
              SW 해제
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={forceClearAPICache}
              disabled={isLoading}
              className="text-xs h-8"
            >
              API 캐시
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={forceClearAllCache}
              disabled={isLoading}
              className="text-xs h-8"
            >
              전체 캐시
            </Button>
          </div>
        </div>

        {/* 캐시 정보 */}
        {cacheInfo.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">캐시 목록</Label>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {cacheInfo.map((cacheName) => (
                <div key={cacheName} className="text-xs text-muted-foreground">
                  {cacheName}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 새로고침 버튼 */}
        <Button
          size="sm"
          onClick={() => window.location.reload()}
          className="w-full text-xs h-8"
        >
          새로고침
        </Button>
      </CardContent>
    </Card>
  );
}

// 개발 환경에서 키보드 단축키로 디버그 패널 토글
export function usePWADebugPanel() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl + Shift + P로 디버그 패널 토글
      if (event.ctrlKey && event.shiftKey && event.key === "P") {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return { isVisible, setIsVisible };
}
