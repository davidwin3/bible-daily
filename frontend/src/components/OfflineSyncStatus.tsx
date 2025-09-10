import { useState } from "react";
import {
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { dayjsUtils } from "../lib/dayjs";
import { useOfflineSync } from "../hooks/useOfflineSync";
// import { cn } from '../lib/utils'; // 현재 사용하지 않음

export function OfflineSyncStatus() {
  const {
    isOnline,
    pendingActions,
    hasPendingActions,
    isSyncing,
    lastSyncResult,
    syncPendingActions,
    clearPendingActions,
  } = useOfflineSync();

  const [isExpanded, setIsExpanded] = useState(false);

  if (!hasPendingActions && isOnline && !lastSyncResult) {
    return null; // 동기화할 내용이 없으면 숨김
  }

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case "CREATE_POST":
        return "게시물 작성";
      case "UPDATE_POST":
        return "게시물 수정";
      case "DELETE_POST":
        return "게시물 삭제";
      case "TOGGLE_LIKE":
        return "좋아요";
      case "COMPLETE_MISSION":
        return "미션 완료";
      default:
        return type;
    }
  };

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}

                <CardTitle className="text-sm">
                  {isOnline ? "온라인" : "오프라인"}
                </CardTitle>

                {isSyncing && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}

                {hasPendingActions && (
                  <Badge variant="secondary" className="text-xs">
                    {pendingActions.length}개 대기
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {lastSyncResult && (
                  <>
                    {lastSyncResult.failed.length > 0 ? (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </>
                )}
              </div>
            </div>

            {hasPendingActions && (
              <p className="text-xs text-muted-foreground mt-1">
                {isOnline
                  ? "동기화 대기 중인 작업이 있습니다"
                  : "오프라인 상태입니다. 온라인 시 자동 동기화됩니다"}
              </p>
            )}
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* 대기 중인 액션 목록 */}
            {hasPendingActions && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">대기 중인 작업</h4>
                  <div className="flex gap-2">
                    {isOnline && !isSyncing && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={syncPendingActions}
                        className="h-7 text-xs"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        동기화
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearPendingActions}
                      className="h-7 text-xs text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3 mr-1" />
                      삭제
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {pendingActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{getActionTypeLabel(action.type)}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {dayjsUtils.parse(action.timestamp)?.format("HH:mm:ss")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 마지막 동기화 결과 */}
            {lastSyncResult && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">마지막 동기화 결과</h4>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>성공: {lastSyncResult.successful.length}개</span>
                  </div>

                  {lastSyncResult.failed.length > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-red-600" />
                      <span>실패: {lastSyncResult.failed.length}개</span>
                    </div>
                  )}
                </div>

                {lastSyncResult.failed.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-red-600">
                      실패한 작업:
                    </p>
                    {lastSyncResult.failed.map((failed, index) => (
                      <div key={index} className="text-xs text-red-600 pl-2">
                        • {getActionTypeLabel(failed.type)}: {failed.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 상태별 안내 메시지 */}
            <div className="mt-4 p-3 bg-muted/30 rounded text-xs">
              {!isOnline ? (
                <p className="text-amber-600">
                  📵 현재 오프라인 상태입니다. 작업한 내용은 자동으로 저장되며,
                  온라인 연결 시 자동으로 동기화됩니다.
                </p>
              ) : isSyncing ? (
                <p className="text-blue-600">🔄 동기화 진행 중입니다...</p>
              ) : hasPendingActions ? (
                <p className="text-amber-600">
                  ⏳ 동기화 대기 중인 작업이 있습니다. 수동으로 동기화하거나
                  잠시 기다려주세요.
                </p>
              ) : (
                <p className="text-green-600">
                  ✅ 모든 작업이 동기화되었습니다.
                </p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
