import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Button from '../components/ui/Button';
import Input  from '../components/ui/Input';
import Select from '../components/ui/Select';

export default function Register() {
  const { login }  = useAuth();
  const { t }      = useLang();
  const navigate   = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', nationality: 'Angolano' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function ch(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError(t.passwordHint); return; }
    setLoading(true);
    try {
      const r = await api.post('/auth/register', form);
      login(r.data.user, r.data.token);
      // Redireciona sempre para o quiz — nivel e atribuido la
      navigate('/quiz');
    } catch (err) {
      setError(err.response?.data?.error || t.genericError);
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
      <div className="auth-tag">{t.exclusivePlatform}</div>
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <h1 className="auth-card__title">{t.register}</h1>
        <p className="auth-card__sub">{t.registerSubtitle}</p>
        {error && <div className="error-banner">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input label={t.name}     type="text"     name="name"     placeholder={t.name}            value={form.name}        onChange={ch} required />
          <Input label={t.email}    type="email"    name="email"    placeholder={t.emailPlaceholder} value={form.email}       onChange={ch} required />
          <Input label={t.password} type="password" name="password" placeholder={t.passwordHint}    value={form.password}    onChange={ch} required />
          <Select label={t.nationality} name="nationality" value={form.nationality} onChange={ch} required>
            <option value="Angolano">Angolano</option>
            <option value="Outro">Outro</option>
          </Select>
          <Button type="submit" loading={loading} full>{t.register}</Button>
        </form>
      </div>
      <p className="auth-footer">
        {t.alreadyHaveAccount} <Link to="/login">{t.loginHere}</Link>
      </p>
    </div>
  );
}
