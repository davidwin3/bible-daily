import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (firebaseToken: string) => api.post("/auth/login", { firebaseToken }),
  completeRegistration: (data: { realName: string; firebaseToken: string }) =>
    api.post("/auth/complete-registration", data),
  getProfile: () => api.get("/auth/me"),
};

// Posts API
export const postsAPI = {
  getPosts: (params: any) => api.get("/posts", { params }),
  getPost: (id: string) => api.get(`/posts/${id}`),
  createPost: (data: any) => api.post("/posts", data),
  updatePost: (id: string, data: any) => api.patch(`/posts/${id}`, data),
  deletePost: (id: string) => api.delete(`/posts/${id}`),
  toggleLike: (id: string) => api.post(`/posts/${id}/like`),
  getLikeStatus: (id: string) => api.get(`/posts/${id}/like-status`),
  getPopularPosts: (limit?: number) =>
    api.get("/posts/popular", { params: { limit } }),
};

// Missions API
export const missionsAPI = {
  getTodayMission: (date?: string) => {
    const params = date ? { date } : {};
    return api.get("/missions/today", { params });
  },
  getMissions: (params: any) => api.get("/missions", { params }),
  getMission: (id: string) => api.get(`/missions/${id}`),
  getMissionByDate: (date: string) => api.get(`/missions/by-date/${date}`),
  toggleCompletion: (id: string) =>
    api.post(`/missions/${id}/toggle-completion`),
  getCompletionStatus: (id: string) =>
    api.get(`/missions/${id}/completion-status`),
  getUserProgress: (month?: string) =>
    api.get("/missions/user/progress", { params: { month } }),
  // Admin API
  getAllMissionsForAdmin: (params: any) =>
    api.get("/missions/admin/all", { params }),
  getMissionStatistics: () => api.get("/missions/admin/statistics"),
  createMission: (data: any) => api.post("/missions/admin", data),
  updateMission: (id: string, data: any) =>
    api.put(`/missions/admin/${id}`, data),
  deleteMission: (id: string) => api.delete(`/missions/admin/${id}`),
  softDeleteMission: (id: string) =>
    api.put(`/missions/admin/${id}/soft-delete`),
};

// Cells API
export const cellsAPI = {
  getCells: () => api.get("/cells"),
  getCell: (id: string) => api.get(`/cells/${id}`),
  createCell: (data: any) => api.post("/cells", data),
  updateCell: (id: string, data: any) => api.patch(`/cells/${id}`, data),
  deleteCell: (id: string) => api.delete(`/cells/${id}`),
  addMember: (cellId: string, data: { userId: string }) =>
    api.post(`/cells/${cellId}/members`, data),
  removeMember: (cellId: string, memberId: string) =>
    api.delete(`/cells/${cellId}/members/${memberId}`),
  getUserCell: () => api.get("/cells/user/my-cell"),
  isLeader: (cellId: string) => api.get(`/cells/${cellId}/is-leader`),
  isMember: (cellId: string) => api.get(`/cells/${cellId}/is-member`),
};
