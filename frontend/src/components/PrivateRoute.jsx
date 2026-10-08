// PrivateRoute.jsx
// Protege qualquer rota que requeira autenticação.
// Não autenticado → /login com redirect de volta após login.
// Autenticado → renderiza o conteúdo.

import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location          = useLocation();

  // Aguarda o AuthContext inicializar antes de redirigir
  // Evita flash de redirect quando a página recarrega
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    // Guarda a rota que o utilizador tentou aceder
    // Após login é rediricionado de volta
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return children;
}
