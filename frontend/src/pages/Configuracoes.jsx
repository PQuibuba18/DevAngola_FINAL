import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api    from '../services/api';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import { IconSun, IconMoon, IconCheck } from '../components/ui/Icons';

export default function Configuracoes() {
  const { user, updateUser } = useAuth();
  const { t }               = useLang();
  const [theme,    setTheme]    = useState(user?.theme    || 'light');
  const [language, setLanguage] = useState(user?.language || 'pt');
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState('');

  // Aplica o tema imediatamente ao clicar (preview antes de guardar)
  function handleTheme(val) {
    setTheme(val);
    document.documentElement.setAttribute('data-theme', val);
  }

  async function save() {
    setLoading(true); setMsg('');
    try {
      await api.put('/users/preferences', { theme, language });
      updateUser({ theme, language });
      // Usa o dicionário da linguagem escolhida para a mensagem de sucesso
      const { DICT } = await import('../context/LanguageContext');
      setMsg(DICT[language]?.prefsSaved || t.prefsSaved);
    } catch {
      setMsg(t.prefsError);
    } finally { setLoading(false); }
  }

  return (
    <div className="page">
      <Navbar />
      <div className="page-body"><div className="page-inner"><div className="settings-wrap">
        <div className="settings-card card">
          <h1 className="settings-title">{t.settingsTitle}</h1>

          {/* ── Tema ── */}
          <div className="settings-section">
            <div className="settings-section__header">
              <h2 className="settings-section__title">{t.themeTitle}</h2>
              <p className="settings-section__desc">{t.themeDesc}</p>
            </div>
            <div className="theme-options">
              {[
                { val:'light', label:t.lightTheme, Icon:IconSun  },
                { val:'dark',  label:t.darkTheme,  Icon:IconMoon },
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

          {/* ── Idioma ── */}
          <div className="settings-section">
            <div className="settings-section__header">
              <h2 className="settings-section__title">{t.langTitle}</h2>
              <p className="settings-section__desc">{t.langDesc}</p>
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

          {msg && <div className={`settings-msg ${msg.includes('Erro')||msg.includes('Error') ? 'settings-msg--error' : ''}`}>{msg}</div>}

          <div className="settings-footer">
            <Button onClick={save} loading={loading}>
              <IconCheck className="icon icon--sm" /> {t.savePrefs}
            </Button>
          </div>
        </div>
      </div></div></div>
    </div>
  );
}
