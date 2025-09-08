import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePWADebug } from "@/hooks/usePWADebug";
import { PWADebugPanel } from "./PWADebugPanel";
import { Bug, X } from "lucide-react";

interface PWADebugToggleProps {}

export function PWADebugToggle({}: PWADebugToggleProps) {
  const { isDebugVisible, toggleDebugPanel, debugInfo } = usePWADebug();

  // 프로덕션 환경에서는 표시하지 않음
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <>
      {/* 플로팅 토글 버튼 */}
      {!isDebugVisible && (
        <div className="fixed bottom-4 right-4 z-[9999]">
          <Button
            onClick={toggleDebugPanel}
            size="sm"
            className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
            title="PWA 디버그 패널 열기"
          >
            <Bug className="h-4 w-4" />
            <Badge
              variant={debugInfo.isOnline ? "default" : "destructive"}
              className="ml-2 text-xs"
            >
              PWA
            </Badge>
          </Button>
        </div>
      )}

      {/* 디버그 패널 오버레이 */}
      {isDebugVisible && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm">
          <div className="fixed inset-4 md:inset-8 flex flex-col">
            <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto bg-background rounded-lg overflow-hidden">
              {/* 디버그 패널 */}
              <div className="flex-1 overflow-hidden">
                <PWADebugPanel className="h-full" />
              </div>

              {/* 하단 고정 닫기 버튼 */}
              <div className="p-4 border-t bg-background">
                <Button
                  onClick={toggleDebugPanel}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  닫기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
