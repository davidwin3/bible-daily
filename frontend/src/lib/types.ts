export interface MissionScripture {
  id?: string;
  startBook: string;
  startChapter: number;
  startVerse?: number;
  endBook?: string;
  endChapter?: number;
  endVerse?: number;
  order: number;
}

export interface Mission {
  id: string;
  date: string;
  scriptures?: MissionScripture[];
  // 하위 호환성을 위한 필드들
  startBook?: string;
  startChapter?: number;
  startVerse?: number;
  endBook?: string;
  endChapter?: number;
  endVerse?: number;
  title?: string;
  description?: string;
  isActive: boolean;
  completionCount?: number;
  totalUsers?: number;
  completionRate?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MissionFormData {
  date: string;
  scriptures: MissionScripture[];
  title?: string;
  description?: string;
}

// User Mission types
export interface UserMission {
  id: string;
  missionId: string;
  userId: string;
  isCompleted: boolean;
  completedAt?: string;
  mission?: Mission;
}

// API Response types
export interface MissionCompletionResponse {
  completed: boolean;
}

export interface UserProgressResponse {
  userMissions: UserMission[];
  totalMissions: number;
  completedMissions: number;
  completionRate: number;
}

// Admin related types
export interface AdminMissionFormData extends MissionFormData {
  // 관리자 전용 추가 필드들
}

export interface CreateMissionRequest {
  date: string;
  scriptures: Omit<MissionScripture, "id">[];
  title?: string;
  description?: string;
}

export interface UpdateMissionRequest extends Partial<CreateMissionRequest> {
  id: string;
}
