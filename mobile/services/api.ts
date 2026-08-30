// services/api.ts
// Cliente Axios para a API REST do DevAngola.
// O token é injectado em cada pedido a partir do SecureStore.
// Respostas 401 disparam logout automático.

import axios from 'axios';
import { Storage } from './storage';

// URL da API — nunca coloca DATABASE_URL ou JWT_SECRET aqui
const BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  'http://10.0.2.2:5000/api'  // 10.0.2.2 = localhost no emulador Android
);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,                  // 15s — tolerante a conexões móveis lentas
  headers: { 'Content-Type': 'application/json' },
});

// Injected token before every request
api.interceptors.request.use(async (config) => {
  const token = await Storage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — clear session and let the app redirect to login
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) {
      await Storage.clearSession();
    }
    return Promise.reject(err);
  }
);

export default api;
