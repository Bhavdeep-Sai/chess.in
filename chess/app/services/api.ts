import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api` 
  : '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (userData: any) => api.post('/auth/register', userData),
  login: (credentials: any) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (profileData: any) => api.put('/auth/me', profileData),
};

// Games API
export const gamesApi = {
  getLobby: () => api.get('/games'),
  createGame: (gameData: any) => api.post('/games', gameData),
  getGame: (roomId: string, guestId?: string) => api.get(`/games/${roomId}`, { 
    params: guestId ? { guestId } : {} 
  }),
};

// Users API
export const usersApi = {
  getRankings: () => api.get('/users'),
  getProfile: (username: string) => api.get(`/users/${username}`),
};

// Utility functions
export const setAuthToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.Authorization;
  }
};

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const getStoredUser = (): any => {
  if (typeof window === 'undefined') return null;
  
  const user = localStorage.getItem('user');
  if (!user || user === 'undefined' || user === 'null') {
    return null;
  }
  try {
    return JSON.parse(user);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export const setStoredUser = (user: any) => {
  if (typeof window === 'undefined') return;
  
  if (user && typeof user === 'object') {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

export const clearAuth = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete api.defaults.headers.Authorization;
};

export default api;
