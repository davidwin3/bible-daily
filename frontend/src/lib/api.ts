import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
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
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (firebaseToken: string) =>
    api.post('/auth/login', { firebaseToken }),
  getProfile: () => api.get('/auth/me'),
};

// Posts API
export const postsAPI = {
  getPosts: (params: any) => api.get('/posts', { params }),
  getPost: (id: string) => api.get(`/posts/${id}`),
  createPost: (data: any) => api.post('/posts', data),
  updatePost: (id: string, data: any) => api.patch(`/posts/${id}`, data),
  deletePost: (id: string) => api.delete(`/posts/${id}`),
  toggleLike: (id: string) => api.post(`/posts/${id}/like`),
  getLikeStatus: (id: string) => api.get(`/posts/${id}/like-status`),
};

// Missions API
export const missionsAPI = {
  getTodayMission: () => api.get('/missions/today'),
  getMissions: (params: any) => api.get('/missions', { params }),
  getMission: (id: string) => api.get(`/missions/${id}`),
  getMissionByDate: (date: string) => api.get(`/missions/by-date/${date}`),
  toggleCompletion: (id: string) => api.post(`/missions/${id}/toggle-completion`),
  getCompletionStatus: (id: string) => api.get(`/missions/${id}/completion-status`),
  getUserProgress: (month?: string) => api.get('/missions/user/progress', { params: { month } }),
};
