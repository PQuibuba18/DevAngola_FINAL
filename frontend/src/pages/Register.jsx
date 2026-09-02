import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Button from '../components/ui/Button';
import Input  from '../components/ui/Input';
import Select from '../components/ui/Select';
import { IconAttach, IconCheck } from '../components/ui/Icons';

export default function Register() {
  const { login }  = useAuth();
  const { t }      = useLang();
  const navigate   = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', level: '', nationality: 'Angolano',
  });
  const [portfolio, setPortfolio] = useState(null);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  function ch(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim())     { setError('Nome obrigatório.');           return; }
    if (!form.email.trim())    { setError('Email obrigatório.');          return; }
    if (form.password.length < 6) { setError('Senha com mínimo 6 caracteres.'); return; }
    if (!form.level)           { setError('Selecciona o teu nível.');    return; }
    if (!portfolio)            { setError('Portfólio ZIP obrigatório.'); return; }
    if (!portfolio.name.toLowerCase().endsWith('.zip')) {
      setError('O portfólio deve ser um ficheiro .zip.');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name',        form.name);
      fd.append('email',       form.email);
      fd.append('password',    form.password);
      fd.append('level',       form.level);
      fd.append('nationality', form.nationality);
      fd.append('portfolio',   portfolio);

      const r = await api.post('/auth/register', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      login(r.data.user, r.data.token);
      // Vai para verificação de identidade se não verificado
      if (r.data.user.verified) {
        navigate('/feed');
      } else {
        navigate('/verificacao');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta.');
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

      <div className="auth-card" style={{ maxWidth: 460 }}>
        <h1 className="auth-card__title">Criar conta</h1>
        <p className="auth-card__sub">Preenche os teus dados para começar</p>

        {error && <div className="error-banner">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input label="Nome Completo" type="text" name="name"
            placeholder="Nome Completo" value={form.name} onChange={ch} required />
          <Input label="E-mail" type="email" name="email"
            placeholder="utilizador@devangola.ao" value={form.email} onChange={ch} required />
          <Input label="Senha" type="password" name="password"
            placeholder="Mínimo 6 caracteres" value={form.password} onChange={ch} required />

          <Select label="Nível" name="level" value={form.level} onChange={ch} required>
            <option value="">Selecciona o teu nível</option>
            <option value="iniciante">Iniciante</option>
            <option value="junior">Júnior</option>
            <option value="pleno">Pleno</option>
            <option value="senior">Sénior</option>
          </Select>

          <Select label="Nacionalidade" name="nationality" value={form.nationality} onChange={ch} required>
            <option value="Angolano">🇦🇴 Angolano</option>
          </Select>

          {/* Portfólio ZIP */}
          <div className="field">
            <label className="field__label">
              Portfólio{' '}
              <span style={{ color: 'var(--red)', fontSize: 'var(--t-xs)', fontWeight: 400 }}>
                (obrigatório · formato .zip)
              </span>
            </label>
            <div
              className="upload-zone"
              style={{ minHeight: 90, cursor: 'pointer' }}
              onClick={() => document.getElementById('portfolio-input').click()}
            >
              <div className="upload-zone__inner" style={{ padding: 'var(--s5)' }}>
                {portfolio ? (
                  <>
                    <IconCheck className="icon icon--lg" style={{ color: 'var(--red)' }} />
                    <span className="upload-zone__label" style={{ fontSize: 'var(--t-sm)', color: 'var(--ink-700)' }}>
                      {portfolio.name}
                    </span>
                    <span className="upload-zone__hint">
                      {(portfolio.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </>
                ) : (
                  <>
                    <IconAttach className="icon icon--lg" style={{ color: 'var(--ink-300)' }} />
                    <span className="upload-zone__label">Clica para anexar o teu portfólio .zip</span>
                    <span className="upload-zone__hint">ZIP · máx. 50 MB</span>
                  </>
                )}
              </div>
            </div>
            <input id="portfolio-input" type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={e => setPortfolio(e.target.files[0] || null)}
              style={{ display: 'none' }} />
            <span className="field__hint">O portfólio serve para verificar que és programador.</span>
          </div>

          <Button type="submit" loading={loading} full>Criar conta</Button>
        </form>
      </div>

      <p className="auth-footer">
        Já tens conta? <Link to="/login">Entra aqui</Link>
      </p>
    </div>
  );
}
