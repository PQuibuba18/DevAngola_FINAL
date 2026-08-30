import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('devangola_token') || localStorage.getItem('devangola_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      const isOnLogin = window.location.pathname === '/login';
      if (!isOnLogin) {
        sessionStorage.clear();
        localStorage.removeItem('devangola_token');
        localStorage.removeItem('devangola_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
