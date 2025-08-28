interface MissionsParams {
  month?: string;
}

export const missionKeys = {
  all: ["missions"] as const,
  lists: () => [...missionKeys.all, "list"] as const,
  list: (params: MissionsParams = {}) =>
    [...missionKeys.lists(), { params }] as const,
  details: () => [...missionKeys.all, "detail"] as const,
  detail: (id: string) => [...missionKeys.details(), { id }] as const,
  today: () => [...missionKeys.all, "today"] as const,
  byDate: (date: string) => [...missionKeys.all, "by-date", { date }] as const,
  completionStatus: (missionId: string) =>
    [...missionKeys.all, "completion-status", { missionId }] as const,
  userProgress: (month?: string) =>
    [...missionKeys.all, "user-progress", { month }] as const,
} as const;
