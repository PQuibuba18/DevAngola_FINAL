// AdminRoute.jsx
// Protege rotas que requerem role='admin'.
// Se não autenticado → /login
// Se autenticado mas não admin → /feed (acesso negado silencioso)
// Se admin → renderiza o conteúdo

import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location          = useLocation();

  // Aguarda o AuthContext carregar (evita redirect prematuro)
  if (loading) return null;

  // Não autenticado → login com redirect de volta
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Autenticado mas não admin → feed
  if (user.role !== 'admin') {
    return <Navigate to="/feed" replace />;
  }

  return children;
}
