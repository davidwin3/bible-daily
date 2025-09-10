import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { dayjsUtils } from "../lib/dayjs";

interface OfflineAction {
  id: string;
  type:
    | "CREATE_POST"
    | "TOGGLE_LIKE"
    | "COMPLETE_MISSION"
    | "UPDATE_POST"
    | "DELETE_POST";
  data: any;
  timestamp: string;
}

interface SyncResult {
  successful: Array<{
    id: string;
    type: string;
    message: string;
  }>;
  failed: Array<{
    id: string;
    type: string;
    error: string;
  }>;
  total: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  // 온라인/오프라인 상태 감지
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("📶 온라인 상태로 변경됨");
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log("📵 오프라인 상태로 변경됨");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 로컬 스토리지에서 대기 중인 액션 로드
  useEffect(() => {
    const stored = localStorage.getItem("bible-daily-pending-actions");
    if (stored) {
      try {
        const actions = JSON.parse(stored);
        setPendingActions(actions);
      } catch (error) {
        console.error("Failed to parse stored actions:", error);
        localStorage.removeItem("bible-daily-pending-actions");
      }
    }
  }, []);

  // 대기 중인 액션 저장
  const savePendingActions = useCallback((actions: OfflineAction[]) => {
    localStorage.setItem(
      "bible-daily-pending-actions",
      JSON.stringify(actions)
    );
    setPendingActions(actions);
  }, []);

  // 오프라인 액션 추가
  const addOfflineAction = useCallback(
    (type: OfflineAction["type"], data: any) => {
      const action: OfflineAction = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: dayjsUtils.toISOString(),
      };

      const newActions = [...pendingActions, action];
      savePendingActions(newActions);

      console.log("📝 오프라인 액션 추가:", action);

      // 온라인 상태면 즉시 동기화 시도
      if (isOnline && !isSyncing) {
        syncPendingActions();
      }

      return action.id;
    },
    [pendingActions, savePendingActions, isOnline, isSyncing]
  );

  // 대기 중인 액션 동기화
  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0 || isSyncing) {
      return;
    }

    setIsSyncing(true);
    console.log(`🔄 ${pendingActions.length}개 액션 동기화 시작`);

    try {
      const response = await api.post("/sync", {
        actions: pendingActions,
        lastSyncAt: localStorage.getItem("bible-daily-last-sync"),
        deviceId: getDeviceId(),
      });

      const result: SyncResult = response.data.results;
      setLastSyncResult(result);

      // 성공한 액션들 제거
      const failedActionIds = result.failed.map((f) => f.id);
      const remainingActions = pendingActions.filter((action) =>
        failedActionIds.includes(action.id)
      );

      savePendingActions(remainingActions);

      // 마지막 동기화 시간 저장
      localStorage.setItem("bible-daily-last-sync", dayjsUtils.toISOString());

      console.log(
        `✅ 동기화 완료: ${result.successful.length}개 성공, ${result.failed.length}개 실패`
      );

      if (result.failed.length > 0) {
        console.warn("실패한 액션들:", result.failed);
      }
    } catch (error) {
      console.error("동기화 실패:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, pendingActions, isSyncing, savePendingActions]);

  // 온라인 상태로 변경시 자동 동기화
  useEffect(() => {
    if (isOnline && pendingActions.length > 0 && !isSyncing) {
      const timer = setTimeout(() => {
        syncPendingActions();
      }, 1000); // 1초 후 동기화

      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingActions.length, isSyncing, syncPendingActions]);

  // Service Worker 메시지 리스너
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_COMPLETED") {
        console.log("🔄 백그라운드 동기화 완료:", event.data.data);
      } else if (event.data?.type === "SYNC_FAILED") {
        console.error("❌ 백그라운드 동기화 실패:", event.data.error);
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, []);

  // 수동 동기화 트리거
  const triggerSync = useCallback(() => {
    if (isOnline && !isSyncing) {
      syncPendingActions();
    }
  }, [isOnline, isSyncing, syncPendingActions]);

  // 대기 중인 액션 삭제
  const clearPendingActions = useCallback(() => {
    savePendingActions([]);
    localStorage.removeItem("bible-daily-last-sync");
    setLastSyncResult(null);
  }, [savePendingActions]);

  return {
    isOnline,
    pendingActions,
    hasPendingActions: pendingActions.length > 0,
    isSyncing,
    lastSyncResult,
    addOfflineAction,
    syncPendingActions: triggerSync,
    clearPendingActions,
  };
}

// 기기 고유 ID 생성/조회
function getDeviceId(): string {
  let deviceId = localStorage.getItem("bible-daily-device-id");

  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    localStorage.setItem("bible-daily-device-id", deviceId);
  }

  return deviceId;
}

// 편의 함수들
export function useOfflinePost() {
  const { addOfflineAction } = useOfflineSync();

  const createOfflinePost = useCallback(
    (postData: { title: string; content: string; bibleVerse?: string }) => {
      return addOfflineAction("CREATE_POST", {
        ...postData,
        clientId: `post-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        createdAt: dayjsUtils.toISOString(),
      });
    },
    [addOfflineAction]
  );

  const updateOfflinePost = useCallback(
    (
      postId: string,
      postData: {
        title?: string;
        content?: string;
        bibleVerse?: string;
      }
    ) => {
      return addOfflineAction("UPDATE_POST", {
        postId,
        ...postData,
      });
    },
    [addOfflineAction]
  );

  const deleteOfflinePost = useCallback(
    (postId: string) => {
      return addOfflineAction("DELETE_POST", { postId });
    },
    [addOfflineAction]
  );

  return {
    createOfflinePost,
    updateOfflinePost,
    deleteOfflinePost,
  };
}

export function useOfflineLike() {
  const { addOfflineAction } = useOfflineSync();

  const toggleOfflineLike = useCallback(
    (postId: number, isLiked: boolean) => {
      return addOfflineAction("TOGGLE_LIKE", { postId, isLiked });
    },
    [addOfflineAction]
  );

  return {
    toggleOfflineLike,
  };
}

export function useOfflineMission() {
  const { addOfflineAction } = useOfflineSync();

  const completeOfflineMission = useCallback(
    (missionId: number, isCompleted: boolean) => {
      return addOfflineAction("COMPLETE_MISSION", { missionId, isCompleted });
    },
    [addOfflineAction]
  );

  return {
    completeOfflineMission,
  };
}
