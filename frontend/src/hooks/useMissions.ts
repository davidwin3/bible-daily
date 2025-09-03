import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { missionsAPI } from "@/lib/api";
import { missionKeys } from "@/queries";
import type { Mission } from "@/lib/types";

export type { Mission };

export interface UserProgress {
  totalMissions: number;
  completedMissions: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
}

// 오늘의 미션 조회
export const useTodayMission = () => {
  return useQuery({
    queryKey: missionKeys.today(),
    queryFn: async () => {
      const response = await missionsAPI.getTodayMission();
      return response.data as Mission;
    },
  });
};

// 월별 미션 목록 조회
export const useMissions = (params: { month?: string } = {}) => {
  return useQuery({
    queryKey: missionKeys.list(params),
    queryFn: async () => {
      const response = await missionsAPI.getMissions(params);
      return response.data as Mission[];
    },
  });
};

// 단일 미션 조회
export const useMission = (id: string) => {
  return useQuery({
    queryKey: missionKeys.detail(id),
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
    queryKey: missionKeys.byDate(date),
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
    queryKey: missionKeys.completionStatus(missionId),
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
    queryKey: missionKeys.userProgress(month),
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
      queryClient.setQueryData(missionKeys.completionStatus(missionId), data);

      // 오늘 미션 완료 수 업데이트
      queryClient.setQueryData(
        missionKeys.today(),
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
        { queryKey: missionKeys.lists(), exact: false },
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
        queryKey: missionKeys.all,
        predicate: (query) =>
          query.queryKey[0] === "missions" &&
          query.queryKey[1] === "user-progress",
      });
    },
  });
};
