import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import { IconSun, IconMoon, IconCheck, IconShield } from '../components/ui/Icons';

export default function Configuracoes() {
  const { user, updateUser, login } = useAuth();
  const { t }                       = useLang();
  const [theme,      setTheme]      = useState(user?.theme    || 'light');
  const [language,   setLanguage]   = useState(user?.language || 'pt');
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [msg,        setMsg]        = useState('');

  function handleTheme(val) {
    setTheme(val);
    document.documentElement.setAttribute('data-theme', val);
  }

  async function save() {
    setLoading(true); setMsg('');
    try {
      await api.put('/users/preferences', { theme, language });
      updateUser({ theme, language });
      setMsg('Preferências guardadas!');
    } catch { setMsg('Erro ao guardar.'); }
    finally { setLoading(false); }
  }

  // Regenera o token com o role actual do banco
  // Necessário após ser promovido a admin no Neon
  async function refreshSession() {
    setRefreshing(true); setMsg('');
    try {
      const r = await api.post('/auth/refresh');
      // login() sobrescreve o token e dados no storage
      login(r.data.user, r.data.token);
      if (r.data.user.role === 'admin') {
        setMsg('✅ Sessão actualizada — és admin! O link Admin aparece na navbar.');
      } else {
        setMsg('✅ Sessão actualizada.');
      }
    } catch { setMsg('Erro ao actualizar sessão.'); }
    finally { setRefreshing(false); }
  }

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner"><div className="settings-wrap">
        <div className="settings-card card">
          <h1 className="settings-title">{t.settingsTitle || 'Configurações'}</h1>

          {/* Tema */}
          <div className="settings-section">
            <div className="settings-section__header">
              <h2 className="settings-section__title">{t.themeTitle || 'Tema'}</h2>
              <p className="settings-section__desc">{t.themeDesc || 'Escolhe o aspecto visual da aplicação.'}</p>
            </div>
            <div className="theme-options">
              {[
                { val:'light', label: t.lightTheme || 'Claro', Icon:IconSun  },
                { val:'dark',  label: t.darkTheme  || 'Escuro', Icon:IconMoon },
              ].map(({ val, label, Icon }) => (
                <button key={val}
                  className={`theme-opt ${theme===val ? 'theme-opt--active' : ''}`}
                  onClick={() => handleTheme(val)}>
                  <div className={`theme-opt__preview theme-opt__preview--${val}`}>
                    <div className="theme-opt__bar" />
                    <div className="theme-opt__lines"><div/><div/><div/></div>
                  </div>
                  <div className="theme-opt__footer">
                    <Icon className="icon icon--sm" />
                    <span>{label}</span>
                    {theme===val && <IconCheck className="icon icon--sm" style={{ color:'var(--red)', marginLeft:'auto' }} />}
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
                  className={`lang-opt ${language===l.code ? 'lang-opt--active' : ''}`}
                  onClick={() => setLanguage(l.code)}>
                  <span className="lang-opt__flag">{l.flag}</span>
                  <span className="lang-opt__label">{l.label}</span>
                  {language===l.code && <IconCheck className="icon icon--sm" style={{ color:'var(--red)', marginLeft:'auto' }} />}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-divider" />

          {/* Actualizar sessão — para admins promovidos no Neon */}
          <div className="settings-section">
            <div className="settings-section__header">
              <h2 className="settings-section__title" style={{ display:'flex', alignItems:'center', gap:8 }}>
                <IconShield className="icon icon--sm" style={{ color:'var(--red)' }} />
                Actualizar Sessão
              </h2>
              <p className="settings-section__desc">
                Se foste promovido a admin no banco de dados, clica aqui para actualizar a sessão sem fazer logout.
              </p>
            </div>
            <Button variant="secondary" loading={refreshing} onClick={refreshSession} style={{ width:'auto' }}>
              <IconShield className="icon icon--sm" /> Actualizar sessão
            </Button>
          </div>

          {msg && (
            <div className={`settings-msg ${msg.toLowerCase().includes('erro') ? 'settings-msg--error' : ''}`}>
              {msg}
            </div>
          )}

          <div className="settings-footer">
            <Button onClick={save} loading={loading}>
              <IconCheck className="icon icon--sm" /> {t.savePrefs || 'Guardar preferências'}
            </Button>
          </div>
        </div>
      </div></div></div>
    </div>
  );
}
