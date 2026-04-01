import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT from localStorage
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('lingua_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
};

export const flashcardsApi = {
  list: (params) => api.get('/flashcards', { params }),
  create: (data) => api.post('/flashcards', data),
  generate: (data) => api.post('/flashcards/generate', data),
  review: (id, result) => api.post(`/flashcards/${id}/review`, { result }),
  delete: (id) => api.delete(`/flashcards/${id}`),
};

export const lessonsApi = {
  list: (params) => api.get('/lessons', { params }),
  get: (id) => api.get(`/lessons/${id}`),
  generate: (data) => api.post('/lessons/generate', data),
  evaluate: (id, data) => api.post(`/lessons/${id}/evaluate`, data),
  complete: (id, data) => api.post(`/lessons/${id}/complete`, data),
};

export const conversationApi = {
  chat: (data) => api.post('/conversation/chat', data),
  endCall: (minutes) => api.post('/conversation/end-call', { minutes }),
};

export const progressApi = {
  stats: () => api.get('/progress/stats'),
};

export default api;
