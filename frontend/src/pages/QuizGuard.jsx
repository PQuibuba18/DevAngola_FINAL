import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Rotas que nao precisam do quiz
const EXEMPT = ['/quiz', '/login', '/cadastro'];

export default function QuizGuard({ children }) {
  const { user, isLoggedIn } = useAuth();
  const navigate             = useNavigate();
  const location             = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { setChecked(true); return; }
    if (EXEMPT.includes(location.pathname)) { setChecked(true); return; }

    // Se o nivel ja e pendente, redireciona imediatamente
    if (user?.level === 'pendente') {
      navigate('/quiz', { replace: true });
      return;
    }

    // Verifica no servidor se o quiz expirou
    api.get('/quiz/status')
      .then(r => {
        if (r.data.needsQuiz) navigate('/quiz', { replace: true });
        else setChecked(true);
      })
      .catch(() => setChecked(true)); // Em caso de erro, deixa passar
  }, [isLoggedIn, user, location.pathname, navigate]);

  if (!checked && isLoggedIn && !EXEMPT.includes(location.pathname)) return null;
  return children;
}
