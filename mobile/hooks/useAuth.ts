// hooks/useAuth.ts
// Contexto de autenticação. O estado vive em memória durante a sessão.
// O token persiste no SecureStore entre sessões.

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Storage } from '../services/storage';
import type { User } from '../types';

interface AuthCtx {
  user:    User | null;
  token:   string | null;
  loading: boolean;
  login:   (user: User, token: string) => Promise<void>;
  logout:  () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
}

export const AuthContext = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}

export function useAuthState() {
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await Storage.getToken();
      const u = await Storage.getUser<User>();
      if (t && u) { setToken(t); setUser(u); }
      setLoading(false);
    })();
  }, []);

  async function login(newUser: User, newToken: string) {
    await Storage.saveSession(newToken, newUser);
    setUser(newUser); setToken(newToken);
  }

  async function logout() {
    await Storage.clearSession();
    setUser(null); setToken(null);
  }

  function updateUser(partial: Partial<User>) {
    if (!user) return;
    const updated = { ...user, ...partial };
    setUser(updated);
    Storage.saveSession(token!, updated);
  }

  return { user, token, loading, login, logout, updateUser };
}
