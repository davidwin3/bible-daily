import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { missionsAPI } from "@/lib/api";

export interface Mission {
  id: string;
  date: Date;
  startBook: string;
  startChapter: number;
  startVerse?: number;
  endBook?: string;
  endChapter?: number;
  endVerse?: number;
  title?: string;
  description?: string;
  completionCount?: number;
  totalUsers?: number;
  completionRate?: number;
}

export interface UserProgress {
  totalMissions: number;
  completedMissions: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
}

export interface MissionsParams {
  month?: string;
}

// 오늘의 미션 조회
export const useTodayMission = () => {
  return useQuery({
    queryKey: ["missions", "today"],
    queryFn: async () => {
      const response = await missionsAPI.getTodayMission();
      return response.data as Mission;
    },
  });
};

// 월별 미션 목록 조회
export const useMissions = (params: MissionsParams = {}) => {
  return useQuery({
    queryKey: ["missions", "list", params],
    queryFn: async () => {
      const response = await missionsAPI.getMissions(params);
      return response.data as Mission[];
    },
  });
};

// 단일 미션 조회
export const useMission = (id: string) => {
  return useQuery({
    queryKey: ["missions", id],
    queryFn: async () => {
      const response = await missionsAPI.getMission(id);
      return response.data as Mission;
    },
    enabled: !!id,
  });
};

// 날짜별 미션 조회
export const useMissionByDate = (date: string) => {
  return useQuery({
    queryKey: ["missions", "by-date", date],
    queryFn: async () => {
      const response = await missionsAPI.getMissionByDate(date);
      return response.data as Mission;
    },
    enabled: !!date,
  });
};

// 미션 완료 상태 조회
export const useCompletionStatus = (
  missionId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["missions", missionId, "completion-status"],
    queryFn: async () => {
      const response = await missionsAPI.getCompletionStatus(missionId);
      return response.data as { completed: boolean };
    },
    enabled: enabled && !!missionId,
  });
};

// 사용자 진행률 조회
export const useUserProgress = (month?: string) => {
  return useQuery({
    queryKey: ["missions", "user-progress", month],
    queryFn: async () => {
      const response = await missionsAPI.getUserProgress(month);
      return response.data as UserProgress;
    },
  });
};

// 미션 완료 토글
export const useToggleCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (missionId: string) => {
      const response = await missionsAPI.toggleCompletion(missionId);
      return { missionId, data: response.data as { completed: boolean } };
    },
    onSuccess: ({ missionId, data }) => {
      // 완료 상태 캐시 업데이트
      queryClient.setQueryData(
        ["missions", missionId, "completion-status"],
        data
      );

      // 오늘 미션 완료 수 업데이트
      queryClient.setQueryData(
        ["missions", "today"],
        (oldData: Mission | undefined) => {
          if (!oldData || oldData.id !== missionId) return oldData;
          return {
            ...oldData,
            completionCount: data.completed
              ? (oldData.completionCount || 0) + 1
              : Math.max(0, (oldData.completionCount || 0) - 1),
          };
        }
      );

      // 미션 목록의 완료 수 업데이트
      queryClient.setQueriesData(
        { queryKey: ["missions", "list"], exact: false },
        (oldData: Mission[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((mission) =>
            mission.id === missionId
              ? {
                  ...mission,
                  completionCount: data.completed
                    ? (mission.completionCount || 0) + 1
                    : Math.max(0, (mission.completionCount || 0) - 1),
                }
              : mission
          );
        }
      );

      // 사용자 진행률 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ["missions", "user-progress"],
      });
    },
  });
};
