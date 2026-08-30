import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Button from '../components/ui/Button';
import Input  from '../components/ui/Input';

export default function Login() {
  const { login }     = useAuth();
  const { t }         = useLang();
  const navigate      = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const r = await api.post('/auth/login', form);
      login(r.data.user, r.data.token);
      navigate('/feed');
    } catch (err) {
      const msg = err.response?.data?.error || '';
      setError(msg.includes('suspen') ? t.suspendedAccount : t.loginError);
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-logo">
        <span className="auth-logo__dev">Dev</span>
        <span className="auth-logo__angola">Angola</span>
        <span className="auth-logo__tld">.ao</span>
      </div>
      <div className="auth-tag">{t.exclusivePlatform}</div>
      <div className="auth-card">
        <h1 className="auth-card__title">{t.login}</h1>
        <p className="auth-card__sub">{t.loginSubtitle}</p>
        {error && <div className="error-banner">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input label={t.email} type="email" name="email"
            placeholder={t.emailPlaceholder} value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required autoComplete="email" />
          <Input label={t.password} type="password" name="password"
            placeholder={t.passwordPlaceholder} value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required autoComplete="current-password" />
          <Button type="submit" loading={loading} full>{t.login}</Button>
        </form>
      </div>
      <p className="auth-footer">
        {t.noAccount} <Link to="/cadastro">{t.registerHere}</Link>
      </p>
    </div>
  );
}
