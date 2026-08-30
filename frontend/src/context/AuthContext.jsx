import { createContext, useContext, useState, useEffect } from 'react';
import { LanguageProvider } from './LanguageContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('devangola_token') || localStorage.getItem('devangola_token');
    const saved = sessionStorage.getItem('devangola_user')  || localStorage.getItem('devangola_user');
    if (token && saved) {
      const parsed = JSON.parse(saved);
      sessionStorage.setItem('devangola_token', token);
      sessionStorage.setItem('devangola_user',  saved);
      setUser(parsed);
      applyTheme(parsed.theme || 'light');
    }
    setLoading(false);
  }, []);

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function login(userData, token) {
    sessionStorage.setItem('devangola_token', token);
    sessionStorage.setItem('devangola_user',  JSON.stringify(userData));
    localStorage.setItem('devangola_token',   token);
    localStorage.setItem('devangola_user',    JSON.stringify(userData));
    setUser(userData);
    applyTheme(userData.theme || 'light');
  }

  function logout() {
    sessionStorage.clear();
    localStorage.removeItem('devangola_token');
    localStorage.removeItem('devangola_user');
    setUser(null);
    applyTheme('light');
  }

  function updateUser(partial) {
    const updated = { ...user, ...partial };
    setUser(updated);
    sessionStorage.setItem('devangola_user', JSON.stringify(updated));
    localStorage.setItem('devangola_user',   JSON.stringify(updated));
    if (partial.theme) applyTheme(partial.theme);
  }

  return (
    <AuthContext.Provider value={{
      user, login, logout, updateUser, loading,
      isLoggedIn: !!user,
      isAdmin:    user?.role === 'admin',
    }}>
      {/* LanguageProvider envolve tudo — qualquer componente acede ao idioma */}
      <LanguageProvider value={user?.language || 'pt'}>
        {children}
      </LanguageProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
