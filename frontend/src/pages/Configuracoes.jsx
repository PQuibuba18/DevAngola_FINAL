import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';

export default function Configuracoes() {
  const { user, updateUser, login } = useAuth();
  const { t }                       = useLang();

  const [theme,      setTheme]      = useState(user?.theme    || 'light');
  const [language,   setLanguage]   = useState(user?.language || 'pt');
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [msg,        setMsg]        = useState('');
  const [msgType,    setMsgType]    = useState('success');

  function handleTheme(val) {
    setTheme(val);
    document.documentElement.setAttribute('data-theme', val);
  }

  function flash(m, type = 'success') {
    setMsg(m); setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  }

  async function save() {
    setLoading(true);
    try {
      await api.put('/users/preferences', { theme, language });
      updateUser({ theme, language });
      flash(t.prefsSaved || 'Preferências guardadas!');
    } catch { flash('Erro ao guardar.', 'error'); }
    finally { setLoading(false); }
  }

  async function refreshSession() {
    setRefreshing(true);
    try {
      const r = await api.post('/auth/refresh');
      login(r.data.user, r.data.token);
      flash(r.data.user.role === 'admin'
        ? 'Sessão actualizada — és admin! O link Admin aparece na navbar.'
        : 'Sessão actualizada com sucesso.');
    } catch { flash('Erro ao actualizar sessão.', 'error'); }
    finally { setRefreshing(false); }
  }

  // Ícones SVG inline para evitar imports desnecessários
  function SunIcon() {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    );
  }
  function MoonIcon() {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
      </svg>
    );
  }
  function CheckIcon() {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    );
  }
  function ShieldIcon() {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner">
        <div className="settings-wrap">
          <div className="card settings-card">
            <h1 className="settings-title">{t.settingsTitle || 'Configurações'}</h1>

            {/* Tema */}
            <div className="settings-section">
              <div className="settings-section__header">
                <h2 className="settings-section__title">{t.themeTitle || 'Tema'}</h2>
                <p className="settings-section__desc">{t.themeDesc || 'Escolhe o aspecto visual da aplicação.'}</p>
              </div>
              <div className="theme-options">
                {[
                  { val:'light', label: t.lightTheme || 'Claro',  Icon: SunIcon  },
                  { val:'dark',  label: t.darkTheme  || 'Escuro', Icon: MoonIcon },
                ].map(({ val, label, Icon }) => (
                  <button key={val}
                    className={`theme-opt${theme===val ? ' theme-opt--active' : ''}`}
                    onClick={() => handleTheme(val)}>
                    <div className={`theme-opt__preview theme-opt__preview--${val}`}>
                      <div className="theme-opt__bar" />
                      <div className="theme-opt__lines"><div/><div/><div/></div>
                    </div>
                    <div className="theme-opt__footer">
                      <Icon />
                      <span>{label}</span>
                      {theme===val && <CheckIcon />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-divider" />

            {/* Idioma */}
            <div className="settings-section">
              <div className="settings-section__header">
                <h2 className="settings-section__title">{t.langTitle || 'Idioma'}</h2>
                <p className="settings-section__desc">{t.langDesc || 'Idioma da interface.'}</p>
              </div>
              <div className="lang-options">
                {[
                  { code:'pt', label:'Português', flag:'🇦🇴' },
                  { code:'en', label:'English',   flag:'🇬🇧' },
                ].map(l => (
                  <button key={l.code}
                    className={`lang-opt${language===l.code ? ' lang-opt--active' : ''}`}
                    onClick={() => setLanguage(l.code)}>
                    <span className="lang-opt__flag">{l.flag}</span>
                    <span className="lang-opt__label">{l.label}</span>
                    {language===l.code && <CheckIcon />}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-divider" />

            {/* Actualizar sessão */}
            <div className="settings-section">
              <div className="settings-section__header">
                <h2 className="settings-section__title">
                  <ShieldIcon /> Actualizar Sessão
                </h2>
                <p className="settings-section__desc">
                  Se foste promovido a admin no banco de dados, clica aqui para actualizar sem fazer logout.
                </p>
              </div>
              <Button variant="secondary" loading={refreshing} onClick={refreshSession} style={{ width:'auto' }}>
                Actualizar sessão
              </Button>
            </div>

            {msg && (
              <div className={`settings-msg${msgType==='error' ? ' settings-msg--error' : ''}`}>
                {msg}
              </div>
            )}

            <div className="settings-footer">
              <Button onClick={save} loading={loading}>
                {t.savePrefs || 'Guardar preferências'}
              </Button>
            </div>
          </div>
        </div>
      </div></div>
    </div>
  );
}
