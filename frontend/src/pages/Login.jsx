import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();

  // Rota de origem — redirige de volta após login
  const from = location.state?.from || '/feed';

  const [form,    setForm]    = useState({ email:'', password:'' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function ch(e) { setForm(f => ({...f, [e.target.name]: e.target.value})); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.email.trim())    { setError('Email obrigatório.');           return; }
    if (!form.password)         { setError('Senha obrigatória.');           return; }

    setLoading(true);
    try {
      const r = await api.post('/auth/login', form);
      login(r.data.user, r.data.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciais inválidas. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <span className="auth-logo__dev">Dev</span>
        <span className="auth-logo__angola">Angola</span>
        <span className="auth-logo__tld">.ao</span>
      </div>

      <div className="auth-tag">Plataforma exclusiva para programadores angolanos</div>

      <div className="auth-card">
        <h1 className="auth-card__title">Entrar</h1>
        <p className="auth-card__sub">Acede à tua conta</p>

        {error && <div className="feedback feedback--error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label">E-mail</label>
            <input
              className="input"
              type="email"
              name="email"
              placeholder="utilizador@devangola.ao"
              value={form.email}
              onChange={ch}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="field">
            <label className="field__label">Senha</label>
            <input
              className="input"
              type="password"
              name="password"
              placeholder="A tua senha"
              value={form.password}
              onChange={ch}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading}
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
      </div>

      <p className="auth-footer">
        Ainda não tens conta?{' '}
        <Link to="/cadastro">Cria a tua conta</Link>
      </p>
    </div>
  );
}
