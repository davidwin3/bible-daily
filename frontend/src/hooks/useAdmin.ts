import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, missionsAPI } from "@/lib/api";
import type { NotificationTopic } from "@/lib/notification-topics";

// Types
interface AdminDashboard {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalCells: number;
    totalMissions: number;
    overallCompletionRate: number;
  };
  missions: {
    totalMissions: number;
    totalUserMissions: number;
    completedUserMissions: number;
    overallCompletionRate: number;
    recentStats: Array<{
      date: string;
      title: string;
      completionCount: number;
      totalUsers: number;
      completionRate: number;
    }>;
  };
  cells: {
    totalCells: number;
    totalMembers: number;
    averageMembersPerCell: number;
    topActiveCells: Array<{
      cellId: string;
      cellName: string;
      leaderName: string;
      memberCount: number;
      completionRate: number;
    }>;
  };
  users: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    roleDistribution: {
      admin: number;
      teacher: number;
      student: number;
    };
    recentActiveUsers: number;
    usersInCells: number;
    usersNotInCells: number;
    newUsers: number;
    activityRate: number;
  };
}

interface MissionScripture {
  id?: string;
  startBook: string;
  startChapter: number;
  startVerse?: number;
  endBook?: string;
  endChapter?: number;
  endVerse?: number;
  order: number;
}

interface Mission {
  id: string;
  date: string;
  scriptures?: MissionScripture[];
  title?: string;
  description?: string;
  isActive: boolean;
  completionCount?: number;
  totalUsers?: number;
  completionRate?: number;
}

interface CreateMissionData {
  date: string;
  scriptures: Omit<MissionScripture, "id">[];
  title?: string;
  description?: string;
}

interface Cell {
  id: string;
  name: string;
  description?: string;
  leaderId: string;
  leader: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  isActive: boolean;
  memberCount?: number;
}

interface CreateCellData {
  name: string;
  description?: string;
  leaderId: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  realName: string;
  profileImage?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  cellInfo?: {
    id: string;
    name: string;
  };
  recentMissions?: number;
  completedMissions?: number;
  completionRate?: number;
  totalPosts?: number;
}

const ADMIN_QUERY_OPTIONS = {
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
} as const;

// Query keys
export const adminKeys = {
  all: ["admin"] as const,
  dashboard: () => [...adminKeys.all, "dashboard"] as const,
  missions: () => [...adminKeys.all, "missions"] as const,
  missionsList: (filters: Record<string, any>) =>
    [...adminKeys.missions(), "list", filters] as const,
  missionStatistics: () => [...adminKeys.missions(), "statistics"] as const,
  cells: () => [...adminKeys.all, "cells"] as const,
  cellsList: () => [...adminKeys.cells(), "list"] as const,
  cellStatistics: () => [...adminKeys.cells(), "statistics"] as const,
  cellDetail: (id: string) => [...adminKeys.cells(), "detail", id] as const,
  users: () => [...adminKeys.all, "users"] as const,
  usersList: () => [...adminKeys.users(), "list"] as const,
  userStatistics: () => [...adminKeys.users(), "statistics"] as const,
  userDetail: (id: string) => [...adminKeys.users(), "detail", id] as const,
  notifications: () => [...adminKeys.all, "notifications"] as const,
};

// Dashboard
export function useAdminDashboard() {
  return useQuery<AdminDashboard>({
    queryKey: adminKeys.dashboard(),
    queryFn: async () => {
      const response = await api.get("/admin/dashboard");
      return response.data;
    },
    ...ADMIN_QUERY_OPTIONS,
  });
}

// Missions
export function useAdminMissions(filters: Record<string, any> = {}) {
  return useQuery<Mission[]>({
    queryKey: adminKeys.missionsList(filters),
    queryFn: async () => {
      const response = await missionsAPI.getAllMissionsForAdmin(filters);
      return response.data;
    },
    ...ADMIN_QUERY_OPTIONS,
  });
}

export function useAdminMissionStatistics() {
  return useQuery({
    queryKey: adminKeys.missionStatistics(),
    queryFn: async () => {
      const response = await missionsAPI.getMissionStatistics();
      return response.data;
    },
    ...ADMIN_QUERY_OPTIONS,
  });
}

export function useCreateMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMissionData) => {
      const response = await missionsAPI.createMission(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.missions() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

export function useUpdateMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateMissionData>;
    }) => {
      const response = await missionsAPI.updateMission(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.missions() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

export function useDeleteMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await missionsAPI.deleteMission(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.missions() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

export function useSoftDeleteMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await missionsAPI.softDeleteMission(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.missions() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

// Cells
export function useAdminCells() {
  return useQuery<Cell[]>({
    queryKey: adminKeys.cellsList(),
    queryFn: async () => {
      const response = await api.get("/cells/admin/all");
      return response.data;
    },
    ...ADMIN_QUERY_OPTIONS,
  });
}

export function useAdminCellStatistics() {
  return useQuery({
    queryKey: adminKeys.cellStatistics(),
    queryFn: async () => {
      const response = await api.get("/cells/admin/statistics");
      return response.data;
    },
    ...ADMIN_QUERY_OPTIONS,
  });
}

export function useAdminCellDetail(id: string) {
  return useQuery({
    queryKey: adminKeys.cellDetail(id),
    queryFn: async () => {
      const response = await api.get(`/cells/admin/${id}/detail`);
      return response.data;
    },
    enabled: !!id,
    ...ADMIN_QUERY_OPTIONS,
  });
}

export function useCreateCell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCellData) => {
      const response = await api.post("/cells/admin", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cells() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

export function useUpdateCell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateCellData>;
    }) => {
      const response = await api.put(`/cells/admin/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cells() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

export function useDeleteCell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/cells/admin/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cells() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

export function useAddMemberToCell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cellId,
      userId,
    }: {
      cellId: string;
      userId: string;
    }) => {
      const response = await api.post(`/cells/admin/${cellId}/members`, {
        userId,
      });
      return response.data;
    },
    onSuccess: (_, { cellId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cellDetail(cellId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.cells() });
    },
  });
}

export function useRemoveMemberFromCell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cellId,
      userId,
    }: {
      cellId: string;
      userId: string;
    }) => {
      const response = await api.delete(
        `/cells/admin/${cellId}/members/${userId}`
      );
      return response.data;
    },
    onSuccess: (_, { cellId }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cellDetail(cellId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.cells() });
    },
  });
}

// Users
export function useAdminUsers() {
  return useQuery<User[]>({
    queryKey: adminKeys.usersList(),
    queryFn: async () => {
      const response = await api.get("/users/admin/all");
      return response.data;
    },
    ...ADMIN_QUERY_OPTIONS,
  });
}

export function useAdminUserStatistics() {
  return useQuery({
    queryKey: adminKeys.userStatistics(),
    queryFn: async () => {
      const response = await api.get("/users/admin/statistics");
      return response.data;
    },
    ...ADMIN_QUERY_OPTIONS,
  });
}

export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: adminKeys.userDetail(id),
    queryFn: async () => {
      const response = await api.get(`/users/admin/${id}/detail`);
      return response.data;
    },
    enabled: !!id,
    ...ADMIN_QUERY_OPTIONS,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const response = await api.put(`/users/admin/${id}/role`, { role });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/users/admin/${id}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/users/admin/${id}/reactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

// Notifications
export interface TopicNotificationPayload {
  topic: NotificationTopic;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export function useSendTopicNotification() {
  return useMutation({
    mutationFn: async (payload: TopicNotificationPayload) => {
      const response = await api.post("/notifications/send-to-topic", {
        topic: payload.topic,
        payload: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
        },
      });
      return response.data;
    },
  });
}

export function useSendTestNotification() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post("/notifications/test");
      return response.data;
    },
  });
}

export function useSubscribeAllToTopic() {
  return useMutation({
    mutationFn: async (topic: NotificationTopic) => {
      const response = await api.post("/notifications/subscribe-all-to-topic", {
        topic,
      });
      return response.data;
    },
  });
}
